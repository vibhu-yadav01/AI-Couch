import { Request } from 'express';

export interface IUser {
  _id: string;
  name: string;
  email: string;
  password: string;
  targetRole: string;
  experienceLevel: 'beginner' | 'intermediate' | 'advanced';
  resumeUrl?: string;
  createdAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

export interface IResumeParsedData {
  skills: string[];
  education: {
    institution: string;
    degree: string;
    year?: string;
  }[];
  experience: {
    company: string;
    role: string;
    duration?: string;
    description?: string;
  }[];
  certifications: string[];
  projects: {
    name: string;
    description: string;
    technologies?: string[];
  }[];
}

export interface IResume {
  _id: string;
  userId: string;
  parsedData: IResumeParsedData;
  rawText: string;
  uploadedAt: Date;
}

export interface IQuestion {
  text: string;
  type: 'behavioral' | 'technical' | 'hr';
}

export interface ISpeechAnalysis {
  confidenceScore: number;
  fillerWordCount: number;
  speechRate: number;
  pauseCount: number;
  fillerWords: string[];
  totalDuration: number;
}

export interface IEvaluation {
  score: number;
  relevance: number;
  clarity: number;
  communication: number;
  technicalAccuracy: number;
  confidence: number;
  strengths: string[];
  improvements: string[];
}

export interface IAnswer {
  questionIndex: number;
  questionText: string;
  answerText: string;
  audioUrl?: string;
  speechAnalysis?: ISpeechAnalysis;
  evaluation?: IEvaluation;
}

export interface IInterview {
  _id: string;
  userId: string;
  role: string;
  type: 'behavioral' | 'technical' | 'hr' | 'mixed';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: number;
  questions: IQuestion[];
  answers: IAnswer[];
  score: number;
  status: 'in-progress' | 'completed';
  createdAt: Date;
}

export interface IAnalytics {
  _id: string;
  userId: string;
  interviewId: string;
  confidenceScore: number;
  fillerWordCount: number;
  communicationScore: number;
  technicalScore: number;
  behavioralScore: number;
  leadershipScore: number;
  overallScore: number;
  createdAt: Date;
}

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
}

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}
