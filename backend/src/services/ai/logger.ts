import { AIProviderName } from '../../types';
import { AIErrorCategory } from './errors';

/**
 * Structured, secret-safe logging for the AI layer.
 *
 * SECURITY: This logger NEVER emits API keys, JWTs, raw resume content, answer
 * text, audio bytes, or any user PII. It records only metadata and sizes.
 */

export type AIFeature = 'parseResume' | 'generateQuestions' | 'evaluateAnswer' | 'transcribeAudio';
export type AIOutcome = 'success' | 'retry' | 'failure';

export interface AILogEntry {
  feature: AIFeature;
  provider: AIProviderName;
  model: string;
  outcome: AIOutcome;
  durationMs?: number;
  attempt?: number;      // 1-based attempt number
  retries?: number;      // total retries performed
  promptChars?: number;  // size only, never the prompt content
  responseChars?: number;// size only, never the response content
  errorCategory?: AIErrorCategory;
  message?: string;      // human-readable, must be secret-free
}

function emit(level: 'info' | 'warn' | 'error', entry: AILogEntry): void {
  const line = JSON.stringify({ scope: 'ai', level, ts: new Date().toISOString(), ...entry });
  if (level === 'error') {
    console.error(line);
  } else if (level === 'warn') {
    console.warn(line);
  } else {
    console.log(line);
  }
}

export const aiLogger = {
  success(entry: Omit<AILogEntry, 'outcome'>): void {
    emit('info', { ...entry, outcome: 'success' });
  },
  retry(entry: Omit<AILogEntry, 'outcome'>): void {
    emit('warn', { ...entry, outcome: 'retry' });
  },
  failure(entry: Omit<AILogEntry, 'outcome'>): void {
    emit('error', { ...entry, outcome: 'failure' });
  },
};
