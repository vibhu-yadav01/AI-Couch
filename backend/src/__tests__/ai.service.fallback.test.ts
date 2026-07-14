/**
 * Proves the AI facade NEVER silently fabricates success. Under forced provider
 * failures or malformed responses it throws a typed AIServiceError instead of
 * returning empty resume arrays, generic questions, or all-70 evaluations.
 */

// Mutable mock for the OpenAI chat completion create() call.
const mockCreate = jest.fn();

jest.mock('openai', () => ({
  __esModule: true,
  default: class MockOpenAI {
    chat = { completions: { create: (...args: any[]) => mockCreate(...args) } };
    audio = { transcriptions: { create: (...args: any[]) => mockCreate(...args) } };
  },
}));

jest.mock('@google/generative-ai', () => ({
  __esModule: true,
  GoogleGenerativeAI: class {
    getGenerativeModel() {
      return { generateContent: (...args: any[]) => mockCreate(...args) };
    }
  },
}));

import * as aiService from '../services/ai.service';
import { AIServiceError } from '../services/ai/errors';

beforeEach(() => {
  process.env.AI_PROVIDER = 'openai';
  process.env.OPENAI_API_KEY = 'sk-test';
  process.env.AI_MAX_RETRIES = '0';
  mockCreate.mockReset();
});

describe('No silent fallback — resume parsing', () => {
  it('throws PROVIDER_AUTH (not empty arrays) when the provider returns 401', async () => {
    mockCreate.mockRejectedValue({ status: 401, message: 'invalid api key' });
    await expect(aiService.parseResume('Skills: React, Node.js')).rejects.toBeInstanceOf(AIServiceError);
    await expect(aiService.parseResume('Skills: React, Node.js')).rejects.toMatchObject({ category: 'PROVIDER_AUTH' });
  });

  it('throws MALFORMED_RESPONSE (not empty arrays) on non-JSON output', async () => {
    mockCreate.mockResolvedValue({ choices: [{ message: { content: 'sorry, I cannot help' } }] });
    await expect(aiService.parseResume('Skills: React')).rejects.toMatchObject({ category: 'MALFORMED_RESPONSE' });
  });

  it('throws MALFORMED_RESPONSE when a real resume parses to all-empty arrays', async () => {
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: JSON.stringify({ skills: [], education: [], experience: [], certifications: [], projects: [] }) } }],
    });
    await expect(aiService.parseResume('Skills: React, Node.js, MongoDB')).rejects.toMatchObject({ category: 'MALFORMED_RESPONSE' });
  });

  it('returns real parsed data on a valid response', async () => {
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: JSON.stringify({ skills: ['React'], education: [], experience: [], certifications: [], projects: [] }) } }],
    });
    const out = await aiService.parseResume('Skills: React');
    expect(out.skills).toEqual(['React']);
  });
});

describe('No silent fallback — answer evaluation', () => {
  it('throws (not all-70) when the provider fails', async () => {
    mockCreate.mockRejectedValue({ status: 500 });
    await expect(
      aiService.evaluateAnswer('Q', 'A reasonably long answer here', 'SWE', 'intermediate')
    ).rejects.toBeInstanceOf(AIServiceError);
  });

  it('throws MALFORMED_RESPONSE (no || 70) when a metric is missing', async () => {
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: JSON.stringify({ score: 88, relevance: 80, clarity: 85, communication: 82, confidence: 84, strengths: ['x'], improvements: ['y'] }) } }],
    });
    await expect(
      aiService.evaluateAnswer('Q', 'A reasonably long answer here', 'SWE', 'intermediate')
    ).rejects.toMatchObject({ category: 'MALFORMED_RESPONSE' });
  });

  it('returns varying real scores on a valid response', async () => {
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: JSON.stringify({ score: 42, relevance: 40, clarity: 45, communication: 38, technicalAccuracy: 41, confidence: 44, strengths: [], improvements: ['be specific'] }) } }],
    });
    const out = await aiService.evaluateAnswer('Q', 'A weak answer that is long enough', 'SWE', 'intermediate');
    expect(out.score).toBe(42);
    expect(out.technicalAccuracy).toBe(41);
  });

  it('short-circuits a too-short answer with explicit zeros (never a fabricated 70)', async () => {
    const out = await aiService.evaluateAnswer('Q', 'no', 'SWE', 'intermediate');
    expect(out.score).toBe(0);
    expect(out.confidence).toBe(0);
    expect(mockCreate).not.toHaveBeenCalled();
  });
});

describe('No silent fallback — transcription', () => {
  it('throws TRANSCRIPTION_FAILED sentinel is never returned', async () => {
    // fs.existsSync will be false for a bogus path -> EMPTY_INPUT before any call
    await expect(aiService.transcribeAudio('/nonexistent/audio.webm')).rejects.toBeInstanceOf(AIServiceError);
  });
});
