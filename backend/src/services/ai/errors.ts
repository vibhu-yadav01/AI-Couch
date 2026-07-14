import { AIProviderName } from '../../types';

/**
 * Categories of AI-layer failure. Each maps to a meaningful HTTP status that the
 * existing central error handler (error.middleware.ts) surfaces to the client.
 */
export type AIErrorCategory =
  | 'CONFIG'                // invalid provider / missing key / bad model config
  | 'CONFIGURATION'         // bad configuration (alias for CONFIG)
  | 'AUTH'                  // invalid or disabled API key
  | 'PROVIDER_AUTH'         // API key or authentication failure
  | 'QUOTA'                 // rate limited / quota exhausted (HTTP 429)
  | 'RATE_LIMIT'            // temporary rate limiting (HTTP 429)
  | 'TIMEOUT'               // request exceeded the configured timeout
  | 'PROVIDER_UNAVAILABLE'  // transient network / 5xx from provider
  | 'MALFORMED_RESPONSE'    // provider returned unparseable or contract-invalid output
  | 'EMPTY_INPUT'           // caller supplied empty/insufficient input
  | 'INVALID_REQUEST'       // bad request (HTTP 400)
  | 'MODEL_UNAVAILABLE'     // model not found / no longer available (HTTP 404)
  | 'TRANSCRIPTION_FAILED'; // audio transcription failed

const CATEGORY_STATUS: Record<AIErrorCategory, number> = {
  CONFIG: 500,
  CONFIGURATION: 500,
  AUTH: 502,
  PROVIDER_AUTH: 502,
  QUOTA: 429,
  RATE_LIMIT: 429,
  TIMEOUT: 504,
  PROVIDER_UNAVAILABLE: 503,
  MALFORMED_RESPONSE: 502,
  EMPTY_INPUT: 400,
  INVALID_REQUEST: 400,
  MODEL_UNAVAILABLE: 404,
  TRANSCRIPTION_FAILED: 502,
};

// Failures safe to retry — transient by nature. Deterministic failures
// (AUTH, CONFIG, EMPTY_INPUT, MALFORMED_RESPONSE, MODEL_UNAVAILABLE, etc.)
// must NEVER be retried by default, because a retry would only mask a permanent error.
const TRANSIENT_CATEGORIES: ReadonlySet<AIErrorCategory> = new Set<AIErrorCategory>([
  'TIMEOUT',
  'PROVIDER_UNAVAILABLE',
]);

export interface ProviderContext {
  provider?: AIProviderName;
  model?: string;
  durationMs?: number;
}

/**
 * Helper to escape regex special characters.
 */
export function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Secret-safe sanitization helper.
 */
export function sanitizeString(str: string): string {
  if (!str) return str;
  let sanitized = str;
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey && apiKey.trim()) {
    sanitized = sanitized.replace(new RegExp(escapeRegExp(apiKey), 'g'), '[REDACTED_API_KEY]');
  }
  // Replace ?key=xyz with ?key=[REDACTED]
  sanitized = sanitized.replace(/key=[a-zA-Z0-9_\-]+/g, 'key=[REDACTED]');
  // Replace Authorization header values
  sanitized = sanitized.replace(/Bearer\s+[a-zA-Z0-9_\-\.]+/gi, 'Bearer [REDACTED]');
  return sanitized;
}

/**
 * Secret-safe sanitization helper for arbitrary values (recursively).
 */
export function sanitizeValue(val: any): any {
  if (typeof val === 'string') {
    return sanitizeString(val);
  }
  if (val && typeof val === 'object') {
    if (Array.isArray(val)) {
      return val.map(sanitizeValue);
    }
    const res: any = {};
    for (const k of Object.keys(val)) {
      res[k] = sanitizeValue(val[k]);
    }
    return res;
  }
  return val;
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
  // Indicates if a failure is retryable. Strict requirement:
  // Retry only when AIServiceError.retryable === true.
  public readonly retryable: boolean;

  constructor(
    category: AIErrorCategory,
    message: string,
    providerContext: ProviderContext = {},
    retryable?: boolean
  ) {
    // Ensure error message is sanitized before passing to super constructor
    const sanitizedMsg = sanitizeString(message);
    super(sanitizedMsg);
    this.name = 'AIServiceError';
    this.category = category;
    this.status = CATEGORY_STATUS[category];
    this.providerContext = providerContext;
    this.retryable = retryable ?? isTransient(category);
    Object.setPrototypeOf(this, AIServiceError.prototype);
  }
}

/** Whether a given error category is transient and therefore retryable by default. */
export function isTransient(category: AIErrorCategory): boolean {
  return TRANSIENT_CATEGORIES.has(category);
}

/** Whether a specific error instance should be retried (strictly checks err.retryable === true). */
export function isRetryable(err: AIServiceError): boolean {
  return err.retryable === true;
}

/**
 * Best-effort classification of an unknown thrown value (usually an SDK error)
 * into an AIServiceError. Inspects common shapes from the OpenAI and Gemini SDKs
 * (HTTP status codes, error messages) without ever capturing secrets.
 */
export function classifyProviderError(err: unknown, ctx: ProviderContext = {}): AIServiceError {
  if (err instanceof AIServiceError) return err;

  const anyErr = err as {
    status?: number;
    statusCode?: number;
    code?: string;
    message?: string;
    errorDetails?: any;
    response?: any;
  };

  const status = anyErr?.status ?? anyErr?.statusCode ?? anyErr?.response?.status;
  const message = (anyErr?.message || '').toLowerCase() + ' ' + (anyErr?.response?.data?.error?.message || '').toLowerCase();
  const code = (anyErr?.code || '').toLowerCase() + ' ' + (anyErr?.response?.data?.error?.code || '').toLowerCase() + ' ' + (anyErr?.response?.data?.error?.status || '').toLowerCase();

  // 404 / NOT_FOUND / model-resource-not-found
  if (
    status === 404 ||
    code.includes('not_found') ||
    code.includes('model-resource-not-found') ||
    message.includes('not found') ||
    message.includes('not_found') ||
    message.includes('no longer available') ||
    message.includes('model-resource-not-found')
  ) {
    return new AIServiceError(
      'MODEL_UNAVAILABLE',
      anyErr?.message || 'AI model resource not found.',
      ctx,
      false
    );
  }

  // 401 / 403
  if (
    status === 401 ||
    status === 403 ||
    message.includes('api key') ||
    message.includes('unauthorized') ||
    message.includes('forbidden') ||
    code.includes('unauthorized') ||
    code.includes('forbidden')
  ) {
    return new AIServiceError(
      'PROVIDER_AUTH',
      anyErr?.message || 'AI provider authentication failed.',
      ctx,
      false
    );
  }

  // 429 quota exhausted
  if (
    status === 429 &&
    (code.includes('quota') ||
      code.includes('billing') ||
      message.includes('quota') ||
      message.includes('billing') ||
      message.includes('credit') ||
      (message.includes('limit exceeded') && !message.includes('rate limit')))
  ) {
    return new AIServiceError(
      'QUOTA',
      anyErr?.message || 'AI provider quota exhausted.',
      ctx,
      false
    );
  }

  // temporary 429 rate limiting
  if (
    status === 429 ||
    message.includes('rate limit') ||
    code.includes('rate_limit') ||
    message.includes('too many requests')
  ) {
    return new AIServiceError(
      'RATE_LIMIT',
      anyErr?.message || 'AI provider rate limit exceeded.',
      ctx,
      true
    );
  }

  // 400 / INVALID_ARGUMENT
  if (
    status === 400 ||
    code.includes('invalid_argument') ||
    code.includes('bad_request') ||
    message.includes('invalid') ||
    message.includes('bad request') ||
    message.includes('invalid_argument')
  ) {
    return new AIServiceError(
      'INVALID_REQUEST',
      anyErr?.message || 'Invalid request to AI provider.',
      ctx,
      false
    );
  }

  // network timeout/reset / timeout messages
  if (
    message.includes('timeout') ||
    message.includes('timed out') ||
    anyErr?.code === 'ETIMEDOUT'
  ) {
    return new AIServiceError(
      'TIMEOUT',
      anyErr?.message || 'AI provider request timed out.',
      ctx,
      true
    );
  }

  // 500 / 502 / 503 / 504 / network
  if (
    (status && status >= 500) ||
    anyErr?.code === 'ECONNRESET' ||
    anyErr?.code === 'ENOTFOUND' ||
    anyErr?.code === 'ECONNREFUSED' ||
    message.includes('network') ||
    message.includes('unavailable')
  ) {
    return new AIServiceError(
      'PROVIDER_UNAVAILABLE',
      anyErr?.message || 'AI provider is temporarily unavailable.',
      ctx,
      true
    );
  }

  // Default fallback is PROVIDER_UNAVAILABLE, retryable = true for network timeout/reset etc.
  return new AIServiceError(
    'PROVIDER_UNAVAILABLE',
    anyErr?.message || 'AI provider request failed.',
    ctx,
    true
  );
}

