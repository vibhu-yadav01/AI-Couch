import { AIProviderName } from '../../types';
import { AIServiceError } from './errors';

const VALID_PROVIDERS: readonly AIProviderName[] = ['openai', 'gemini'];

export interface AIConfig {
  provider: AIProviderName;
  openaiModel: string;
  openaiTranscriptionModel: string;
  geminiModel: string;
  timeoutMs: number;
  maxRetries: number;
}

/** Read AI configuration from the environment, applying defaults. */
export function getAIConfig(env: NodeJS.ProcessEnv = process.env): AIConfig {
  const provider = (env.AI_PROVIDER || 'openai').toLowerCase() as AIProviderName;

  const timeoutRaw = env.AI_TIMEOUT_MS;
  const timeoutMs = timeoutRaw ? parseInt(timeoutRaw, 10) : 20000;

  const retriesRaw = env.AI_MAX_RETRIES;
  const maxRetries = retriesRaw ? parseInt(retriesRaw, 10) : 2;

  return {
    provider,
    openaiModel: env.OPENAI_MODEL || 'gpt-4o-mini',
    openaiTranscriptionModel: env.OPENAI_TRANSCRIPTION_MODEL || 'whisper-1',
    geminiModel: env.GEMINI_MODEL || 'gemini-1.5-flash',
    timeoutMs,
    maxRetries,
  };
}

/**
 * Validate AI configuration at startup and FAIL FAST on misconfiguration rather
 * than deferring failures to the first AI request. Throws AIServiceError('CONFIG')
 * when the provider is unknown, the selected provider's key is missing, or the
 * model/timeout configuration is invalid. Never logs or returns secret values.
 */
export function validateAIConfig(env: NodeJS.ProcessEnv = process.env): AIConfig {
  const config = getAIConfig(env);

  if (!(VALID_PROVIDERS as readonly string[]).includes(config.provider)) {
    throw new AIServiceError(
      'CONFIG',
      `Invalid AI_PROVIDER "${config.provider}". Must be one of: ${VALID_PROVIDERS.join(', ')}.`
    );
  }

  if (config.provider === 'openai') {
    if (!env.OPENAI_API_KEY || !env.OPENAI_API_KEY.trim()) {
      throw new AIServiceError('CONFIG', 'AI_PROVIDER is "openai" but OPENAI_API_KEY is missing or empty.');
    }
    if (!config.openaiModel.trim()) {
      throw new AIServiceError('CONFIG', 'OPENAI_MODEL is set but empty.');
    }
  }

  if (config.provider === 'gemini') {
    if (!env.GEMINI_API_KEY || !env.GEMINI_API_KEY.trim()) {
      throw new AIServiceError('CONFIG', 'AI_PROVIDER is "gemini" but GEMINI_API_KEY is missing or empty.');
    }
    if (!config.geminiModel.trim()) {
      throw new AIServiceError('CONFIG', 'GEMINI_MODEL is set but empty.');
    }
  }

  if (!Number.isFinite(config.timeoutMs) || config.timeoutMs <= 0) {
    throw new AIServiceError('CONFIG', 'AI_TIMEOUT_MS must be a positive integer.');
  }
  if (!Number.isFinite(config.maxRetries) || config.maxRetries < 0) {
    throw new AIServiceError('CONFIG', 'AI_MAX_RETRIES must be a non-negative integer.');
  }

  return config;
}
