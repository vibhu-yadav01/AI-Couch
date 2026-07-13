import { ISpeechAnalysis } from '../types';

// All filler words to detect
const FILLER_WORDS = [
  'um', 'uh', 'er', 'ah', 'like', 'basically', 'literally', 'actually',
  'you know', 'i mean', 'right', 'so', 'okay', 'ok', 'well', 'anyway',
  'kind of', 'sort of', 'stuff', 'things',
];

/**
 * Analyze a speech transcription for quality metrics.
 *
 * @param transcription - The text transcription of the speech
 * @param durationSeconds - Duration of the audio recording in seconds
 * @returns ISpeechAnalysis object with all computed metrics
 */
export function analyzeSpeech(transcription: string, durationSeconds: number): ISpeechAnalysis {
  // NOTE: The '[Transcription unavailable]' sentinel no longer reaches this function —
  // transcribeAudio now throws AIServiceError('TRANSCRIPTION_FAILED') on failure, so a
  // failed transcription surfaces as an explicit error rather than being analyzed as
  // zeroed "fake success". Only a genuinely empty string is guarded here.
  if (!transcription || transcription.trim() === '') {
    return {
      confidenceScore: 0,
      fillerWordCount: 0,
      speechRate: 0,
      pauseCount: 0,
      fillerWords: [],
      totalDuration: durationSeconds,
    };
  }

  const text = transcription.toLowerCase().trim();
  const words = text.split(/\s+/).filter((w) => w.length > 0);
  const totalWords = words.length;

  // ─── 1. Filler Word Detection ───────────────────────────────────────────────
  const detectedFillers: string[] = [];
  let fillerWordCount = 0;

  for (const filler of FILLER_WORDS) {
    // Use word boundary regex to match whole words/phrases only
    const escapedFiller = filler.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${escapedFiller}\\b`, 'gi');
    const matches = transcription.match(regex);
    if (matches && matches.length > 0) {
      fillerWordCount += matches.length;
      detectedFillers.push(filler);
    }
  }

  // ─── 2. Speech Rate (Words Per Minute) ──────────────────────────────────────
  const durationMinutes = durationSeconds > 0 ? durationSeconds / 60 : 1;
  const speechRate = Math.round(totalWords / durationMinutes);

  // ─── 3. Pause Detection (heuristic via punctuation) ─────────────────────────
  // Count sentences/clauses as approximation of pauses
  const pauseMatches = transcription.match(/[.!?;,—…]+/g);
  const pauseCount = pauseMatches ? pauseMatches.length : 0;

  // ─── 4. Confidence Score Calculation ────────────────────────────────────────
  // Filler word penalty: each filler word reduces confidence by 3 points (max -30)
  const fillerPenalty = Math.min(fillerWordCount * 3, 30);

  // Speech rate penalty: ideal range 120-180 WPM
  let pacePenalty = 0;
  if (speechRate < 80) {
    pacePenalty = 20; // Too slow
  } else if (speechRate < 110) {
    pacePenalty = 10; // Slightly slow
  } else if (speechRate > 200) {
    pacePenalty = 15; // Too fast
  } else if (speechRate > 180) {
    pacePenalty = 5; // Slightly fast
  }

  // Pause penalty: too many hesitation pauses
  const normalizedPauseCount = Math.max(0, pauseCount - Math.floor(totalWords / 20));
  const pausePenalty = Math.min(normalizedPauseCount * 2, 20);

  // Word variety bonus (reduces monotony penalty)
  const uniqueWords = new Set(words).size;
  const diversityRatio = totalWords > 0 ? uniqueWords / totalWords : 0;
  const diversityBonus = diversityRatio > 0.6 ? 5 : 0;

  const confidenceScore = Math.min(
    100,
    Math.max(0, 100 - fillerPenalty - pacePenalty - pausePenalty + diversityBonus)
  );

  return {
    confidenceScore: Math.round(confidenceScore),
    fillerWordCount,
    speechRate: Math.max(0, speechRate),
    pauseCount,
    fillerWords: detectedFillers,
    totalDuration: durationSeconds,
  };
}
