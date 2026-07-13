import { validateAIConfig } from '../services/ai/config';
import { AIServiceError } from '../services/ai/errors';

describe('validateAIConfig (fail-fast startup validation)', () => {
  it('accepts a valid OpenAI configuration', () => {
    const cfg = validateAIConfig({ AI_PROVIDER: 'openai', OPENAI_API_KEY: 'sk-test' } as any);
    expect(cfg.provider).toBe('openai');
    expect(cfg.openaiModel).toBe('gpt-4o-mini');
  });

  it('accepts a valid Gemini configuration', () => {
    const cfg = validateAIConfig({ AI_PROVIDER: 'gemini', GEMINI_API_KEY: 'gm-test' } as any);
    expect(cfg.provider).toBe('gemini');
  });

  it('fails fast on an unknown provider', () => {
    try {
      validateAIConfig({ AI_PROVIDER: 'claude', OPENAI_API_KEY: 'x' } as any);
      fail('expected throw');
    } catch (e: any) {
      expect(e).toBeInstanceOf(AIServiceError);
      expect(e.category).toBe('CONFIG');
      expect(e.status).toBe(500);
    }
  });

  it('fails fast when the OpenAI key is missing', () => {
    try {
      validateAIConfig({ AI_PROVIDER: 'openai', OPENAI_API_KEY: '' } as any);
      fail('expected throw');
    } catch (e: any) {
      expect(e.category).toBe('CONFIG');
    }
  });

  it('fails fast when the Gemini key is missing', () => {
    try {
      validateAIConfig({ AI_PROVIDER: 'gemini' } as any);
      fail('expected throw');
    } catch (e: any) {
      expect(e.category).toBe('CONFIG');
    }
  });

  it('rejects a non-positive timeout', () => {
    expect(() =>
      validateAIConfig({ AI_PROVIDER: 'openai', OPENAI_API_KEY: 'x', AI_TIMEOUT_MS: '0' } as any)
    ).toThrow(AIServiceError);
  });
});
