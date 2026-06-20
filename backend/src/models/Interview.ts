import mongoose, { Document, Schema } from 'mongoose';

export interface IInterviewDocument extends Document {
  userId: mongoose.Types.ObjectId;
  role: string;
  type: 'behavioral' | 'technical' | 'hr' | 'mixed';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: number;
  questions: {
    text: string;
    type: string;
  }[];
  answers: {
    questionIndex: number;
    questionText: string;
    answerText: string;
    audioUrl?: string;
    speechAnalysis?: {
      confidenceScore: number;
      fillerWordCount: number;
      speechRate: number;
      pauseCount: number;
      fillerWords: string[];
      totalDuration: number;
    };
    evaluation?: {
      score: number;
      relevance: number;
      clarity: number;
      communication: number;
      technicalAccuracy: number;
      confidence: number;
      strengths: string[];
      improvements: string[];
    };
  }[];
  score: number;
  status: 'in-progress' | 'completed';
  createdAt: Date;
  updatedAt: Date;
}

const speechAnalysisSchema = new Schema(
  {
    confidenceScore: { type: Number, default: 0 },
    fillerWordCount: { type: Number, default: 0 },
    speechRate: { type: Number, default: 0 },
    pauseCount: { type: Number, default: 0 },
    fillerWords: [{ type: String }],
    totalDuration: { type: Number, default: 0 },
  },
  { _id: false }
);

const evaluationSchema = new Schema(
  {
    score: { type: Number, default: 0 },
    relevance: { type: Number, default: 0 },
    clarity: { type: Number, default: 0 },
    communication: { type: Number, default: 0 },
    technicalAccuracy: { type: Number, default: 0 },
    confidence: { type: Number, default: 0 },
    strengths: [{ type: String }],
    improvements: [{ type: String }],
  },
  { _id: false }
);

const InterviewSchema = new Schema<IInterviewDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    role: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ['behavioral', 'technical', 'hr', 'mixed'],
      required: true,
    },
    difficulty: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      required: true,
    },
    duration: { type: Number, default: 10 },
    questions: [
      {
        text: { type: String, required: true },
        type: { type: String, default: 'hr' },
      },
    ],
    answers: [
      {
        questionIndex: { type: Number, required: true },
        questionText: { type: String, required: true },
        answerText: { type: String, default: '' },
        audioUrl: { type: String },
        speechAnalysis: speechAnalysisSchema,
        evaluation: evaluationSchema,
      },
    ],
    score: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['in-progress', 'completed'],
      default: 'in-progress',
    },
  },
  { timestamps: true }
);

// Compound index for user history queries
InterviewSchema.index({ userId: 1, createdAt: -1 });

const Interview = mongoose.model<IInterviewDocument>('Interview', InterviewSchema);

export default Interview;
