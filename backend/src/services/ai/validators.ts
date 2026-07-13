import {
  IResumeParsedData,
  IQuestion,
  IEvaluation,
} from '../../types';
import { AIServiceError, ProviderContext } from './errors';

const QUESTION_TYPES = ['behavioral', 'technical', 'hr'] as const;
const EVAL_METRICS = [
  'score',
  'relevance',
  'clarity',
  'communication',
  'technicalAccuracy',
  'confidence',
] as const;

const clamp = (n: number): number => Math.min(100, Math.max(0, n));

/**
 * Robustly extract and parse a JSON value from a raw model response.
 * Strips markdown code fences (```json ... ```), trims surrounding prose, and
 * parses the first balanced JSON object/array. Throws MALFORMED_RESPONSE on
 * unrecoverable input rather than silently falling back.
 */
export function parseJsonFromModel(raw: string, ctx: ProviderContext = {}): unknown {
  if (!raw || !raw.trim()) {
    throw new AIServiceError('MALFORMED_RESPONSE', 'AI returned an empty response.', ctx);
  }

  let text = raw.trim();

  // Strip fenced code blocks: ```json ... ``` or ``` ... ```
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenceMatch) {
    text = fenceMatch[1].trim();
  }

  // Try a direct parse first.
  try {
    return JSON.parse(text);
  } catch {
    // Fall through to bracket extraction.
  }

  // Extract the first JSON object or array by locating balanced brackets.
  const candidate = extractBalanced(text);
  if (candidate) {
    try {
      return JSON.parse(candidate);
    } catch {
      // fall through
    }
  }

  throw new AIServiceError('MALFORMED_RESPONSE', 'AI response was not valid JSON.', ctx);
}

/** Extract the first balanced {...} or [...] block from a string. */
function extractBalanced(text: string): string | null {
  const startObj = text.indexOf('{');
  const startArr = text.indexOf('[');
  let start = -1;
  let open = '{';
  let close = '}';

  if (startArr !== -1 && (startObj === -1 || startArr < startObj)) {
    start = startArr;
    open = '[';
    close = ']';
  } else if (startObj !== -1) {
    start = startObj;
  }
  if (start === -1) return null;

  let depth = 0;
  let inString = false;
  let escape = false;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (escape) {
      escape = false;
      continue;
    }
    if (ch === '\\') {
      escape = true;
      continue;
    }
    if (ch === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;
    if (ch === open) depth++;
    else if (ch === close) {
      depth--;
      if (depth === 0) return text.slice(start, i + 1);
    }
  }
  return null;
}

const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

/**
 * Validate a parsed resume against IResumeParsedData. All five fields must exist
 * and be arrays. A fully-empty parse of non-empty source text is rejected as
 * malformed (a real resume must not silently parse to nothing).
 */
export function validateResumeParse(
  parsed: unknown,
  sourceTextIsNonEmpty: boolean,
  ctx: ProviderContext = {}
): IResumeParsedData {
  if (!isObject(parsed)) {
    throw new AIServiceError('MALFORMED_RESPONSE', 'Resume parse result is not an object.', ctx);
  }
  const required = ['skills', 'education', 'experience', 'certifications', 'projects'];
  for (const field of required) {
    if (!Array.isArray(parsed[field])) {
      throw new AIServiceError(
        'MALFORMED_RESPONSE',
        `Resume parse result missing required array field "${field}".`,
        ctx
      );
    }
  }

  const data = parsed as unknown as IResumeParsedData;

  const allEmpty =
    data.skills.length === 0 &&
    data.education.length === 0 &&
    data.experience.length === 0 &&
    data.certifications.length === 0 &&
    data.projects.length === 0;

  if (sourceTextIsNonEmpty && allEmpty) {
    throw new AIServiceError(
      'MALFORMED_RESPONSE',
      'Resume text was non-empty but parsed to an all-empty structure.',
      ctx
    );
  }

  return data;
}

/**
 * Validate generated questions: a non-empty array of { text, type } with valid
 * types and at least `count` items. Over-generation is sliced; under-generation
 * or wrong shapes are rejected (no generic default padding).
 */
export function validateQuestions(
  parsed: unknown,
  count: number,
  ctx: ProviderContext = {}
): IQuestion[] {
  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new AIServiceError('MALFORMED_RESPONSE', 'Questions response is not a non-empty array.', ctx);
  }

  const questions: IQuestion[] = [];
  for (const item of parsed) {
    if (!isObject(item)) continue;
    const text = item.text;
    const type = item.type;
    if (
      typeof text === 'string' &&
      text.trim().length > 0 &&
      typeof type === 'string' &&
      (QUESTION_TYPES as readonly string[]).includes(type)
    ) {
      questions.push({ text: text.trim(), type: type as IQuestion['type'] });
    }
  }

  if (questions.length < count) {
    throw new AIServiceError(
      'MALFORMED_RESPONSE',
      `Expected at least ${count} valid questions, received ${questions.length}.`,
      ctx
    );
  }

  return questions.slice(0, count);
}

/**
 * Validate an evaluation against IEvaluation. All six numeric metrics must exist
 * and be numbers (NO `|| 70` substitution); each is clamped to 0–100. Both
 * strengths and improvements must be string arrays.
 */
export function validateEvaluation(parsed: unknown, ctx: ProviderContext = {}): IEvaluation {
  if (!isObject(parsed)) {
    throw new AIServiceError('MALFORMED_RESPONSE', 'Evaluation response is not an object.', ctx);
  }

  for (const metric of EVAL_METRICS) {
    if (typeof parsed[metric] !== 'number' || Number.isNaN(parsed[metric] as number)) {
      throw new AIServiceError(
        'MALFORMED_RESPONSE',
        `Evaluation missing required numeric metric "${metric}".`,
        ctx
      );
    }
  }

  const strengths = Array.isArray(parsed.strengths)
    ? (parsed.strengths as unknown[]).filter((s): s is string => typeof s === 'string')
    : null;
  const improvements = Array.isArray(parsed.improvements)
    ? (parsed.improvements as unknown[]).filter((s): s is string => typeof s === 'string')
    : null;

  if (!strengths || !improvements) {
    throw new AIServiceError(
      'MALFORMED_RESPONSE',
      'Evaluation missing strengths/improvements string arrays.',
      ctx
    );
  }

  return {
    score: clamp(parsed.score as number),
    relevance: clamp(parsed.relevance as number),
    clarity: clamp(parsed.clarity as number),
    communication: clamp(parsed.communication as number),
    technicalAccuracy: clamp(parsed.technicalAccuracy as number),
    confidence: clamp(parsed.confidence as number),
    strengths,
    improvements,
  };
}

const TRANSCRIPTION_SENTINEL = '[Transcription unavailable]';

/** Validate a transcript: a non-empty string that is not the failure sentinel. */
export function validateTranscription(transcript: string, ctx: ProviderContext = {}): string {
  const trimmed = (transcript || '').trim();
  if (!trimmed || trimmed === TRANSCRIPTION_SENTINEL) {
    throw new AIServiceError('TRANSCRIPTION_FAILED', 'Transcription produced no usable text.', ctx);
  }
  return trimmed;
}
