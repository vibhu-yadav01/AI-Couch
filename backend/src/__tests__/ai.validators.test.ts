import {
  parseJsonFromModel,
  validateResumeParse,
  validateQuestions,
  validateEvaluation,
  validateTranscription,
} from '../services/ai/validators';
import { AIServiceError } from '../services/ai/errors';

describe('AI response validators (hard gate against silent fallback)', () => {
  describe('parseJsonFromModel', () => {
    it('parses plain JSON', () => {
      expect(parseJsonFromModel('{"a":1}')).toEqual({ a: 1 });
    });

    it('unwraps ```json fenced blocks', () => {
      const raw = 'Here you go:\n```json\n{"skills":["React"]}\n```\nThanks!';
      expect(parseJsonFromModel(raw)).toEqual({ skills: ['React'] });
    });

    it('extracts a JSON array embedded in prose', () => {
      const raw = 'Sure! [{"text":"Q1","type":"technical"}] done';
      expect(parseJsonFromModel(raw)).toEqual([{ text: 'Q1', type: 'technical' }]);
    });

    it('throws MALFORMED_RESPONSE on empty input', () => {
      expect(() => parseJsonFromModel('')).toThrow(AIServiceError);
      try {
        parseJsonFromModel('   ');
      } catch (e: any) {
        expect(e.category).toBe('MALFORMED_RESPONSE');
      }
    });

    it('throws MALFORMED_RESPONSE on non-JSON', () => {
      try {
        parseJsonFromModel('the model refused to answer');
      } catch (e: any) {
        expect(e.category).toBe('MALFORMED_RESPONSE');
      }
    });
  });

  describe('validateResumeParse', () => {
    const good = {
      skills: ['React', 'Node.js'],
      education: [{ institution: 'X', degree: 'CS', year: '2024' }],
      experience: [],
      certifications: [],
      projects: [],
    };

    it('accepts a well-formed resume with content', () => {
      expect(validateResumeParse(good, true).skills).toContain('React');
    });

    it('rejects an all-empty parse when source text was non-empty', () => {
      const empty = { skills: [], education: [], experience: [], certifications: [], projects: [] };
      try {
        validateResumeParse(empty, true);
        fail('expected throw');
      } catch (e: any) {
        expect(e).toBeInstanceOf(AIServiceError);
        expect(e.category).toBe('MALFORMED_RESPONSE');
      }
    });

    it('rejects a missing required array field', () => {
      const bad = { skills: ['React'], education: [], experience: [], certifications: [] } as any;
      expect(() => validateResumeParse(bad, true)).toThrow(AIServiceError);
    });
  });

  describe('validateQuestions', () => {
    it('rejects fewer than the requested count (no default padding)', () => {
      const two = [
        { text: 'Q1', type: 'technical' },
        { text: 'Q2', type: 'behavioral' },
      ];
      try {
        validateQuestions(two, 5);
        fail('expected throw');
      } catch (e: any) {
        expect(e.category).toBe('MALFORMED_RESPONSE');
      }
    });

    it('slices over-generation down to count', () => {
      const many = Array.from({ length: 8 }, (_, i) => ({ text: `Q${i}`, type: 'hr' }));
      expect(validateQuestions(many, 5)).toHaveLength(5);
    });

    it('rejects invalid question types', () => {
      const bad = [{ text: 'Q1', type: 'nonsense' }];
      expect(() => validateQuestions(bad, 1)).toThrow(AIServiceError);
    });
  });

  describe('validateEvaluation', () => {
    const full = {
      score: 91, relevance: 88, clarity: 90, communication: 87, technicalAccuracy: 93, confidence: 89,
      strengths: ['clear'], improvements: ['more detail'],
    };

    it('accepts a complete evaluation and clamps to 0-100', () => {
      const out = validateEvaluation({ ...full, score: 120, confidence: -5 });
      expect(out.score).toBe(100);
      expect(out.confidence).toBe(0);
    });

    it('rejects a missing metric (NO || 70 substitution)', () => {
      const { technicalAccuracy, ...partial } = full as any;
      try {
        validateEvaluation(partial);
        fail('expected throw');
      } catch (e: any) {
        expect(e.category).toBe('MALFORMED_RESPONSE');
      }
    });

    it('rejects when strengths/improvements are not arrays', () => {
      expect(() => validateEvaluation({ ...full, strengths: 'nope' } as any)).toThrow(AIServiceError);
    });
  });

  describe('validateTranscription', () => {
    it('returns a real transcript', () => {
      expect(validateTranscription('  hello world  ')).toBe('hello world');
    });

    it('rejects the failure sentinel', () => {
      try {
        validateTranscription('[Transcription unavailable]');
        fail('expected throw');
      } catch (e: any) {
        expect(e.category).toBe('TRANSCRIPTION_FAILED');
      }
    });

    it('rejects empty transcript', () => {
      expect(() => validateTranscription('   ')).toThrow(AIServiceError);
    });
  });
});
