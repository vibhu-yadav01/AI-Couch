import {
  IResumeParsedData,
  IQuestion,
  IEvaluation,
} from '../types';
import { getProvider } from './ai';

/**
 * Thin facade over the AI provider layer. Controllers depend on these functions
 * only — never on the OpenAI/Gemini SDKs. Each call is routed to the provider
 * selected by AI_PROVIDER (via getProvider) and returns validated domain data or
 * throws an AIServiceError. There is no silent fallback: failures propagate to
 * the central error handler.
 *
 * The public return shapes are the existing domain contracts (IResumeParsedData,
 * IQuestion[], IEvaluation, string) so existing API responses are unchanged;
 * provider/model metadata stays server-side (logged, not leaked to clients).
 */

const MIN_ANSWER_LENGTH = 10;

export async function parseResume(rawText: string): Promise<IResumeParsedData> {
  const result = await getProvider().parseResume(rawText);
  return result.parsedData;
}

export async function generateQuestions(
  role: string,
  type: string,
  difficulty: string,
  resumeData?: IResumeParsedData,
  count: number = 10
): Promise<IQuestion[]> {
  const result = await getProvider().generateQuestions(role, type, difficulty, resumeData, count);
  return result.questions;
}

export async function evaluateAnswer(
  question: string,
  answer: string,
  role: string,
  difficulty: string
): Promise<IEvaluation> {
  // Preserved short-answer short-circuit: an answer below the minimum length is
  // not sent to the provider. It returns an explicit, honest minimal evaluation
  // (a genuinely empty/too-short answer scores low) — never a fabricated 70.
  if (!answer || answer.trim().length < MIN_ANSWER_LENGTH) {
    return {
      score: 0,
      relevance: 0,
      clarity: 0,
      communication: 0,
      technicalAccuracy: 0,
      confidence: 0,
      strengths: [],
      improvements: [
        'The answer was empty or too short to evaluate. Provide a complete, detailed response.',
      ],
    };
  }

  const result = await getProvider().evaluateAnswer(question, answer, role, difficulty);
  return result.evaluation;
}

export async function transcribeAudio(audioFilePath: string): Promise<string> {
  const result = await getProvider().transcribeAudio(audioFilePath);
  return result.transcript;
}
