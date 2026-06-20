import { analyzeSpeech } from '../services/speech.service';

describe('Speech Analysis Service', () => {
  it('should return default/zeroed values for empty transcription', () => {
    const result = analyzeSpeech('', 30);
    expect(result.confidenceScore).toBe(0);
    expect(result.fillerWordCount).toBe(0);
    expect(result.speechRate).toBe(0);
    expect(result.pauseCount).toBe(0);
    expect(result.fillerWords).toEqual([]);
  });

  it('should detect filler words accurately', () => {
    const text = 'Basically, I think we should, um, like, implement this feature, you know.';
    const result = analyzeSpeech(text, 10);
    // Filler words in text: basically, um, like, you know. Total count = 4
    expect(result.fillerWordCount).toBe(4);
    expect(result.fillerWords).toContain('um');
    expect(result.fillerWords).toContain('like');
    expect(result.fillerWords).toContain('basically');
    expect(result.fillerWords).toContain('you know');
  });

  it('should calculate words per minute (speech rate)', () => {
    // 20 words in 10 seconds -> 120 words per minute
    const text = 'This is a test transcription containing exactly twenty words that should map out to a standard WPM pacing rate here.';
    const result = analyzeSpeech(text, 10);
    expect(result.speechRate).toBe(120);
  });

  it('should approximate pause counts from punctuation marks', () => {
    const text = 'First point. Second point, which has details; third point!';
    const result = analyzeSpeech(text, 15);
    // Punctuation matches: '.', ',', ';', '!' -> 4 pauses
    expect(result.pauseCount).toBe(4);
  });

  it('should penalize confidence score for excess filler words', () => {
    const cleanText = 'I am a highly motivated software developer with deep experience in TypeScript and Node.js.';
    const fillerText = 'Um, I like am a highly motivated, basically, developer with uh experience, you know.';

    const cleanResult = analyzeSpeech(cleanText, 30);
    const fillerResult = analyzeSpeech(fillerText, 30);

    // Cleaner speech should have higher confidence score than speech riddled with filler words
    expect(cleanResult.confidenceScore).toBeGreaterThan(fillerResult.confidenceScore);
  });
});
