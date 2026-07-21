import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import path from 'path';
import { AIProvider } from './AIProvider';
import {
  IResumeParsedData,
  IAIResumeParseResult,
  IAIQuestionsResult,
  IAIEvaluationResult,
  IAITranscriptionResult,
} from '../../types';
import { AIConfig } from './config';
import { AIServiceError, classifyProviderError, sanitizeValue } from './errors';
import { withRetry, withTimeout } from './runtime';
import { aiLogger, AIFeature } from './logger';
import { resumePrompt, questionsPrompt, evaluationPrompt, PromptPair } from './prompts';
import {
  parseJsonFromModel,
  validateResumeParse,
  validateQuestions,
  validateEvaluation,
  validateTranscription,
} from './validators';

const AUDIO_MIME: Record<string, string> = {
  mp3: 'audio/mpeg',
  wav: 'audio/wav',
  m4a: 'audio/mp4',
  mp4: 'audio/mp4',
  webm: 'audio/webm',
  ogg: 'audio/ogg',
  caf: 'audio/x-caf',
  aac: 'audio/aac',
  '3gp': 'audio/3gpp',
};

/**
 * Extract and log secret-safe development diagnostics at the immediate Gemini provider boundary.
 */
function logBoundaryDiagnostics(err: any, feature: string, model: string): void {
  const extracted = {
    name: err?.name,
    message: err?.message,
    status: err?.status,
    statusCode: err?.statusCode,
    code: err?.code,
    responseStatus: err?.response?.status,
    responseDataErrorCode: err?.response?.data?.error?.code,
    responseDataErrorStatus: err?.response?.data?.error?.status,
    responseDataErrorMessage: err?.response?.data?.error?.message,
    errorDetails: err?.errorDetails,
  };
  const sanitized = sanitizeValue(extracted);
  console.error(
    `[GeminiProvider Boundary Error] feature=${feature} model=${model} diagnostics=${JSON.stringify(sanitized, null, 2)}`
  );
}

/**
 * Gemini implementation of the single AIProvider interface. This is one of the
 * only two modules permitted to import the @google/generative-ai SDK.
 */
export class GeminiProvider implements AIProvider {
  public readonly name = 'gemini' as const;
  private genAI: GoogleGenerativeAI;
  private config: AIConfig;

  constructor(config: AIConfig) {
    this.config = config;
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
  }

  private get model(): string {
    return this.config.geminiModel;
  }

  private async complete(prompt: PromptPair, feature: AIFeature): Promise<{ raw: string; durationMs: number }> {
    const promptChars = prompt.system.length + prompt.user.length;
    const start = Date.now();
    const model = this.genAI.getGenerativeModel({
      model: this.model,
      systemInstruction: prompt.system,
    });
    const fullPrompt = prompt.user;

    const raw = await withRetry(
      () =>
        withTimeout(
          model
            .generateContent(fullPrompt)
            .then((result) => result.response.text())
            .catch((err) => {
              logBoundaryDiagnostics(err, feature, this.model);
              throw classifyProviderError(err, { provider: this.name, model: this.model });
            }),
          this.config.timeoutMs,
          { provider: this.name, model: this.model }
        ),
      { feature, provider: this.name, model: this.model, maxRetries: this.config.maxRetries, promptChars }
    );

    return { raw, durationMs: Date.now() - start };
  }

  async parseResume(rawText: string): Promise<IAIResumeParseResult> {
    const ctx = { provider: this.name, model: this.model };
    const { raw, durationMs } = await this.complete(resumePrompt(rawText), 'parseResume');
    const parsed = parseJsonFromModel(raw, ctx);
    const parsedData = validateResumeParse(parsed, rawText.trim().length > 0, ctx);
    aiLogger.success({ feature: 'parseResume', provider: this.name, model: this.model, durationMs, responseChars: raw.length });
    return { parsedData, provider: this.name, model: this.model, durationMs };
  }

  async generateQuestions(
    role: string,
    type: string,
    difficulty: string,
    resumeData: IResumeParsedData | undefined,
    count: number
  ): Promise<IAIQuestionsResult> {
    const ctx = { provider: this.name, model: this.model };
    const { raw, durationMs } = await this.complete(
      questionsPrompt(role, type, difficulty, resumeData, count),
      'generateQuestions'
    );
    const parsed = parseJsonFromModel(raw, ctx);
    const questions = validateQuestions(parsed, count, ctx);
    aiLogger.success({ feature: 'generateQuestions', provider: this.name, model: this.model, durationMs, responseChars: raw.length });
    return { questions, provider: this.name, model: this.model, durationMs };
  }

  async evaluateAnswer(
    question: string,
    answer: string,
    role: string,
    difficulty: string
  ): Promise<IAIEvaluationResult> {
    const ctx = { provider: this.name, model: this.model };
    const { raw, durationMs } = await this.complete(
      evaluationPrompt(question, answer, role, difficulty),
      'evaluateAnswer'
    );
    const parsed = parseJsonFromModel(raw, ctx);
    const evaluation = validateEvaluation(parsed, ctx);
    aiLogger.success({ feature: 'evaluateAnswer', provider: this.name, model: this.model, durationMs, responseChars: raw.length });
    return { evaluation, provider: this.name, model: this.model, durationMs };
  }

  async transcribeAudio(audioFilePath: string): Promise<IAITranscriptionResult> {
    if (!fs.existsSync(audioFilePath)) {
      throw new AIServiceError('EMPTY_INPUT', `Audio file not found: ${audioFilePath}`, { provider: this.name });
    }
    const ctx = { provider: this.name, model: this.model };
    const start = Date.now();
    const ext = path.extname(audioFilePath).slice(1).toLowerCase();
    const mimeType = AUDIO_MIME[ext] || 'audio/webm';
    const base64Audio = fs.readFileSync(audioFilePath).toString('base64');
    const model = this.genAI.getGenerativeModel({ model: this.model });

    const text = await withRetry(
      () =>
        withTimeout(
          model
            .generateContent([
              { inlineData: { data: base64Audio, mimeType } },
              'Please transcribe this audio recording exactly as spoken. Return only the transcription text, no additional commentary.',
            ])
            .then((result) => result.response.text())
            .catch((err) => {
              logBoundaryDiagnostics(err, 'transcribeAudio', this.model);
              throw classifyProviderError(err, ctx);
            }),
          this.config.timeoutMs,
          { provider: this.name, model: this.model }
        ),
      { feature: 'transcribeAudio', provider: this.name, model: this.model, maxRetries: this.config.maxRetries }
    );

    const durationMs = Date.now() - start;
    const transcript = validateTranscription(text, ctx);
    aiLogger.success({ feature: 'transcribeAudio', provider: this.name, model: this.model, durationMs, responseChars: transcript.length });
    return { transcript, provider: this.name, model: this.model, durationMs };
  }
}

