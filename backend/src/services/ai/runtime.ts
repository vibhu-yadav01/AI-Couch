import { AIProviderName } from '../../types';
import { AIServiceError, classifyProviderError, isRetryable } from './errors';
import { aiLogger, AIFeature } from './logger';

/** Reject with a TIMEOUT AIServiceError if the promise does not settle in time. */
export function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  ctx: { provider: AIProviderName; model: string }
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new AIServiceError('TIMEOUT', `AI request exceeded ${timeoutMs}ms.`, ctx));
    }, timeoutMs);
    timer.unref?.();

    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      }
    );
  });
}

const sleep = (ms: number): Promise<void> =>
  new Promise((r) => {
    const t = setTimeout(r, ms);
    t.unref?.();
  });

export interface RetryOptions {
  feature: AIFeature;
  provider: AIProviderName;
  model: string;
  maxRetries: number;
  promptChars?: number;
}

/**
 * Execute an operation with bounded retries. Retries fire ONLY for transient
 * error categories (TIMEOUT, PROVIDER_UNAVAILABLE, QUOTA). Deterministic failures
 * (AUTH, CONFIG, EMPTY_INPUT, MALFORMED_RESPONSE, TRANSCRIPTION_FAILED) are thrown
 * immediately so a retry can never mask a permanent error. Every attempt is logged.
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  opts: RetryOptions
): Promise<T> {
  const { feature, provider, model, maxRetries, promptChars } = opts;
  let lastError: AIServiceError | null = null;

  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    const start = Date.now();
    try {
      return await operation();
    } catch (err) {
      const aiErr = classifyProviderError(err, { provider, model, durationMs: Date.now() - start });
      lastError = aiErr;

      const canRetry = isRetryable(aiErr) && attempt <= maxRetries;
      if (canRetry) {
        aiLogger.retry({
          feature,
          provider,
          model,
          attempt,
          retries: attempt,
          promptChars,
          durationMs: aiErr.providerContext.durationMs,
          errorCategory: aiErr.category,
          message: aiErr.message,
        });
        await sleep(Math.min(2000, 250 * 2 ** (attempt - 1))); // exponential backoff, capped
        continue;
      }
      throw aiErr;
    }
  }

  // Unreachable, but satisfies the type checker.
  throw lastError ?? new AIServiceError('PROVIDER_UNAVAILABLE', 'AI request failed.', { provider, model });
}
