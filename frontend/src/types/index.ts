export interface User {
  id: string;
  name: string;
  email: string;
  targetRole: string;
  experienceLevel: string;
  resumeUrl?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export interface ResumeParsedData {
  skills: string[];
  education: { institution: string; degree: string; year?: string }[];
  experience: { company: string; role: string; duration?: string; description?: string }[];
  certifications: string[];
  projects: { name: string; description: string; technologies?: string[] }[];
}

export interface Resume {
  _id: string;
  userId: string;
  parsedData: ResumeParsedData;
  uploadedAt: string;
}

export interface Question {
  text: string;
  type: string;
}

export interface SpeechAnalysis {
  confidenceScore: number;
  fillerWordCount: number;
  speechRate: number;
  pauseCount: number;
  fillerWords: string[];
  totalDuration: number;
}

export interface Evaluation {
  score: number;
  relevance: number;
  clarity: number;
  communication: number;
  technicalAccuracy: number;
  confidence: number;
  strengths: string[];
  improvements: string[];
}

export interface Answer {
  questionIndex: number;
  questionText: string;
  answerText: string;
  audioUrl?: string;
  speechAnalysis?: SpeechAnalysis;
  evaluation?: Evaluation;
}

export interface Interview {
  _id: string;
  userId: string;
  role: string;
  type: string;
  difficulty: string;
  duration: number;
  questions: Question[];
  answers: Answer[];
  score: number;
  status: string;
  createdAt: string;
}

export interface Analytics {
  totalInterviews: number;
  averageScore: number;
  skillScores: {
    communication: number;
    technical: number;
    behavioral: number;
    leadership: number;
  };
  scoreHistory: { date: string; score: number }[];
  confidenceTrend: { date: string; score: number }[];
  fillerWordTrend: { date: string; count: number }[];
  recentInterviews: Interview[];
}

export interface InterviewSetup {
  role: string;
  type: 'behavioral' | 'technical' | 'hr' | 'mixed';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: number;
}
