import OpenAI from 'openai';
import fs from 'fs';
import { AIProvider } from './AIProvider';
import {
  IResumeParsedData,
  IAIResumeParseResult,
  IAIQuestionsResult,
  IAIEvaluationResult,
  IAITranscriptionResult,
} from '../../types';
import { AIConfig } from './config';
import { AIServiceError, classifyProviderError } from './errors';
import { withRetry, withTimeout } from './runtime';
import { aiLogger } from './logger';
import { resumePrompt, questionsPrompt, evaluationPrompt, PromptPair } from './prompts';
import {
  parseJsonFromModel,
  validateResumeParse,
  validateQuestions,
  validateEvaluation,
  validateTranscription,
} from './validators';

/**
 * OpenAI implementation of the single AIProvider interface. This is one of the
 * only two modules permitted to import the OpenAI SDK.
 */
export class OpenAIProvider implements AIProvider {
  public readonly name = 'openai' as const;
  private client: OpenAI;
  private config: AIConfig;

  constructor(config: AIConfig) {
    this.config = config;
    this.client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }

  private get model(): string {
    return this.config.openaiModel;
  }

  /** Single chat completion returning raw text, wrapped in timeout + retry. */
  private async complete(prompt: PromptPair, feature: Parameters<typeof aiLogger.success>[0]['feature']): Promise<{ raw: string; durationMs: number }> {
    const promptChars = prompt.system.length + prompt.user.length;
    const start = Date.now();

    const raw = await withRetry(
      () =>
        withTimeout(
          this.client.chat.completions
            .create({
              model: this.model,
              messages: [
                { role: 'system', content: prompt.system },
                { role: 'user', content: prompt.user },
              ],
              temperature: 0.7,
            })
            .then((resp) => resp.choices[0]?.message?.content || ''),
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
    const parsedData: IResumeParsedData = validateResumeParse(parsed, rawText.trim().length > 0, ctx);
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
    const model = this.config.openaiTranscriptionModel;
    const ctx = { provider: this.name, model };
    const start = Date.now();

    const text = await withRetry(
      () =>
        withTimeout(
          this.client.audio.transcriptions
            .create({
              file: fs.createReadStream(audioFilePath) as unknown as File,
              model,
              language: 'en',
            })
            .then((resp) => resp.text || '')
            .catch((err) => {
              throw classifyProviderError(err, ctx);
            }),
          this.config.timeoutMs,
          { provider: this.name, model }
        ),
      { feature: 'transcribeAudio', provider: this.name, model, maxRetries: this.config.maxRetries }
    );

    const durationMs = Date.now() - start;
    const transcript = validateTranscription(text, ctx);
    aiLogger.success({ feature: 'transcribeAudio', provider: this.name, model, durationMs, responseChars: transcript.length });
    return { transcript, provider: this.name, model, durationMs };
  }
}
