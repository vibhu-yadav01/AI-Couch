import {
  AIServiceError,
  classifyProviderError,
  isTransient,
  isRetryable,
} from '../services/ai/errors';

describe('AIServiceError category -> HTTP status mapping', () => {
  const cases: Array<[any, number]> = [
    ['CONFIG', 500],
    ['AUTH', 502],
    ['QUOTA', 429],
    ['TIMEOUT', 504],
    ['PROVIDER_UNAVAILABLE', 503],
    ['MALFORMED_RESPONSE', 502],
    ['EMPTY_INPUT', 400],
    ['TRANSCRIPTION_FAILED', 502],
  ];
  it.each(cases)('%s -> %d', (category, status) => {
    expect(new AIServiceError(category, 'x').status).toBe(status);
  });
});

describe('classifyProviderError', () => {
  it('maps 401 to PROVIDER_AUTH (non-retryable)', () => {
    const e = classifyProviderError({ status: 401, message: 'invalid api key' });
    expect(e.category).toBe('PROVIDER_AUTH');
    expect(isRetryable(e)).toBe(false);
  });

  it('maps insufficient_quota to a NON-retryable QUOTA (billing)', () => {
    const e = classifyProviderError({ status: 429, code: 'insufficient_quota', message: 'You exceeded your current quota' });
    expect(e.category).toBe('QUOTA');
    expect(isRetryable(e)).toBe(false);
  });

  it('maps a plain rate limit to a retryable RATE_LIMIT', () => {
    const e = classifyProviderError({ status: 429, message: 'Rate limit reached' });
    expect(e.category).toBe('RATE_LIMIT');
    expect(isRetryable(e)).toBe(true);
  });

  it('maps 404 to MODEL_UNAVAILABLE (non-retryable)', () => {
    const e = classifyProviderError({ status: 404, message: 'model gemini-2.5-flash is no longer available' });
    expect(e.category).toBe('MODEL_UNAVAILABLE');
    expect(isRetryable(e)).toBe(false);
  });

  it('maps 400 to INVALID_REQUEST (non-retryable)', () => {
    const e = classifyProviderError({ status: 400, message: 'invalid arguments' });
    expect(e.category).toBe('INVALID_REQUEST');
    expect(isRetryable(e)).toBe(false);
  });

  it('maps timeouts to TIMEOUT (retryable)', () => {
    const e = classifyProviderError({ message: 'request timed out' });
    expect(e.category).toBe('TIMEOUT');
    expect(isRetryable(e)).toBe(true);
  });

  it('maps 5xx / network to PROVIDER_UNAVAILABLE (retryable)', () => {
    const e = classifyProviderError({ status: 503 });
    expect(e.category).toBe('PROVIDER_UNAVAILABLE');
    expect(isRetryable(e)).toBe(true);
  });

  it('passes through an existing AIServiceError unchanged', () => {
    const orig = new AIServiceError('MALFORMED_RESPONSE', 'bad');
    expect(classifyProviderError(orig)).toBe(orig);
  });
});
