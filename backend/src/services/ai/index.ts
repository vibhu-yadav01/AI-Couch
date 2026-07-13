import { AIProvider } from './AIProvider';
import { OpenAIProvider } from './OpenAIProvider';
import { GeminiProvider } from './GeminiProvider';
import { getAIConfig, validateAIConfig, AIConfig } from './config';
import { AIServiceError } from './errors';

/**
 * Provider factory. Reads AI_PROVIDER through configuration (re-read per call, not
 * captured once at module load) and returns the matching AIProvider implementation.
 * Switching AI_PROVIDER between "openai" and "gemini" changes the provider with no
 * code change. Unknown values throw AIServiceError('CONFIG').
 */
export function getProvider(config: AIConfig = getAIConfig()): AIProvider {
  switch (config.provider) {
    case 'openai':
      return new OpenAIProvider(config);
    case 'gemini':
      return new GeminiProvider(config);
    default:
      throw new AIServiceError(
        'CONFIG',
        `Invalid AI_PROVIDER "${config.provider}". Must be "openai" or "gemini".`
      );
  }
}

export { validateAIConfig, getAIConfig };
export { AIServiceError } from './errors';
export type { AIProvider } from './AIProvider';
