import { AIProviderName } from '../../types';

/**
 * Categories of AI-layer failure. Each maps to a meaningful HTTP status that the
 * existing central error handler (error.middleware.ts) surfaces to the client.
 */
export type AIErrorCategory =
  | 'CONFIG'                // invalid provider / missing key / bad model config
  | 'AUTH'                  // invalid or disabled API key
  | 'QUOTA'                 // rate limited (HTTP 429)
  | 'TIMEOUT'               // request exceeded the configured timeout
  | 'PROVIDER_UNAVAILABLE'  // transient network / 5xx from provider
  | 'MALFORMED_RESPONSE'    // provider returned unparseable or contract-invalid output
  | 'EMPTY_INPUT'           // caller supplied empty/insufficient input
  | 'TRANSCRIPTION_FAILED'; // audio transcription failed

const CATEGORY_STATUS: Record<AIErrorCategory, number> = {
  CONFIG: 500,
  AUTH: 502,
  QUOTA: 429,
  TIMEOUT: 504,
  PROVIDER_UNAVAILABLE: 503,
  MALFORMED_RESPONSE: 502,
  EMPTY_INPUT: 400,
  TRANSCRIPTION_FAILED: 502,
};

// Failures safe to retry — transient by nature. Deterministic failures
// (AUTH, CONFIG, EMPTY_INPUT, MALFORMED_RESPONSE) must NEVER be retried, because
// a retry would only mask a permanent error.
const TRANSIENT_CATEGORIES: ReadonlySet<AIErrorCategory> = new Set<AIErrorCategory>([
  'TIMEOUT',
  'PROVIDER_UNAVAILABLE',
  'QUOTA',
]);

export interface ProviderContext {
  provider?: AIProviderName;
  model?: string;
  durationMs?: number;
}

/**
 * Typed error for all AI-layer failures. Carries a `category`, the HTTP `status`
 * the central handler should emit, and secret-free provider context. Never
 * contains API keys, prompts, or user content.
 */
export class AIServiceError extends Error {
  public readonly category: AIErrorCategory;
  public readonly status: number;
  public readonly providerContext: ProviderContext;
  // Optional override: when set, takes precedence over category-based transience.
  // Used to mark e.g. `insufficient_quota` (a billing problem) as non-retryable
  // even though it shares the QUOTA category with transient rate limits.
  public readonly retryable?: boolean;

  constructor(
    category: AIErrorCategory,
    message: string,
    providerContext: ProviderContext = {},
    retryable?: boolean
  ) {
    super(message);
    this.name = 'AIServiceError';
    this.category = category;
    this.status = CATEGORY_STATUS[category];
    this.providerContext = providerContext;
    this.retryable = retryable;
    Object.setPrototypeOf(this, AIServiceError.prototype);
  }
}

/** Whether a given error category is transient and therefore retryable. */
export function isTransient(category: AIErrorCategory): boolean {
  return TRANSIENT_CATEGORIES.has(category);
}

/** Whether a specific error instance should be retried (instance override wins). */
export function isRetryable(err: AIServiceError): boolean {
  return err.retryable ?? isTransient(err.category);
}

/**
 * Best-effort classification of an unknown thrown value (usually an SDK error)
 * into an AIServiceError. Inspects common shapes from the OpenAI and Gemini SDKs
 * (HTTP status codes, error messages) without ever capturing secrets.
 */
export function classifyProviderError(err: unknown, ctx: ProviderContext = {}): AIServiceError {
  if (err instanceof AIServiceError) return err;

  const anyErr = err as { status?: number; statusCode?: number; code?: string; message?: string };
  const status = anyErr?.status ?? anyErr?.statusCode;
  const message = (anyErr?.message || '').toLowerCase();

  if (status === 401 || status === 403 || message.includes('api key') || message.includes('unauthorized')) {
    return new AIServiceError('AUTH', 'AI provider authentication failed (invalid or disabled API key).', ctx);
  }
  const code = (anyErr as { code?: string }).code || '';
  if (code === 'insufficient_quota' || message.includes('exceeded your current quota') || message.includes('billing')) {
    // Account is out of credits — permanent until billing is resolved. Do NOT retry.
    return new AIServiceError(
      'QUOTA',
      'AI provider quota exhausted (billing/credits). Check the account plan and billing.',
      ctx,
      false
    );
  }
  if (status === 429 || message.includes('rate limit')) {
    // True rate limiting — transient, safe to retry with backoff.
    return new AIServiceError('QUOTA', 'AI provider rate limit exceeded.', ctx, true);
  }
  if (message.includes('timeout') || message.includes('timed out') || anyErr?.code === 'ETIMEDOUT') {
    return new AIServiceError('TIMEOUT', 'AI provider request timed out.', ctx);
  }
  if ((status && status >= 500) || anyErr?.code === 'ECONNRESET' || anyErr?.code === 'ENOTFOUND' || message.includes('network')) {
    return new AIServiceError('PROVIDER_UNAVAILABLE', 'AI provider is temporarily unavailable.', ctx);
  }
  return new AIServiceError('PROVIDER_UNAVAILABLE', 'AI provider request failed.', ctx);
}
