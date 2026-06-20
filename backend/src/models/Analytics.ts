import mongoose, { Document, Schema } from 'mongoose';

export interface IAnalyticsDocument extends Document {
  userId: mongoose.Types.ObjectId;
  interviewId: mongoose.Types.ObjectId;
  confidenceScore: number;
  fillerWordCount: number;
  communicationScore: number;
  technicalScore: number;
  behavioralScore: number;
  leadershipScore: number;
  overallScore: number;
  createdAt: Date;
  updatedAt: Date;
}

const AnalyticsSchema = new Schema<IAnalyticsDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    interviewId: {
      type: Schema.Types.ObjectId,
      ref: 'Interview',
      required: true,
    },
    confidenceScore: { type: Number, default: 0 },
    fillerWordCount: { type: Number, default: 0 },
    communicationScore: { type: Number, default: 0 },
    technicalScore: { type: Number, default: 0 },
    behavioralScore: { type: Number, default: 0 },
    leadershipScore: { type: Number, default: 0 },
    overallScore: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Indexes for fast dashboard aggregations
AnalyticsSchema.index({ userId: 1, createdAt: -1 });
AnalyticsSchema.index({ userId: 1, interviewId: 1 });

const Analytics = mongoose.model<IAnalyticsDocument>('Analytics', AnalyticsSchema);

export default Analytics;
