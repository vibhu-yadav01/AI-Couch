import {
  IResumeParsedData,
  IAIResumeParseResult,
  IAIQuestionsResult,
  IAIEvaluationResult,
  IAITranscriptionResult,
} from '../../types';

/**
 * The single interface exposed by the AI provider layer. The rest of the
 * application depends on this interface only and never imports the OpenAI or
 * Gemini SDKs directly. Each method returns a strongly typed, validated result
 * or throws an AIServiceError — it never returns fabricated success.
 */
export interface AIProvider {
  readonly name: 'openai' | 'gemini';

  parseResume(rawText: string): Promise<IAIResumeParseResult>;

  generateQuestions(
    role: string,
    type: string,
    difficulty: string,
    resumeData: IResumeParsedData | undefined,
    count: number
  ): Promise<IAIQuestionsResult>;

  evaluateAnswer(
    question: string,
    answer: string,
    role: string,
    difficulty: string
  ): Promise<IAIEvaluationResult>;

  transcribeAudio(audioFilePath: string): Promise<IAITranscriptionResult>;
}
