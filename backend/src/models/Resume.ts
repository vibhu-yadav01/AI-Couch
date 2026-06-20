import mongoose, { Document, Schema } from 'mongoose';

export interface IResumeDocument extends Document {
  userId: mongoose.Types.ObjectId;
  parsedData: {
    skills: string[];
    education: { institution: string; degree: string; year?: string }[];
    experience: { company: string; role: string; duration?: string; description?: string }[];
    certifications: string[];
    projects: { name: string; description: string; technologies?: string[] }[];
  };
  rawText: string;
  uploadedAt: Date;
}

const ResumeSchema = new Schema<IResumeDocument>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  parsedData: {
    skills: [{ type: String }],
    education: [
      {
        institution: { type: String, default: '' },
        degree: { type: String, default: '' },
        year: { type: String },
      },
    ],
    experience: [
      {
        company: { type: String, default: '' },
        role: { type: String, default: '' },
        duration: { type: String },
        description: { type: String },
      },
    ],
    certifications: [{ type: String }],
    projects: [
      {
        name: { type: String, default: '' },
        description: { type: String, default: '' },
        technologies: [{ type: String }],
      },
    ],
  },
  rawText: {
    type: String,
    default: '',
  },
  uploadedAt: {
    type: Date,
    default: Date.now,
  },
});

const Resume = mongoose.model<IResumeDocument>('Resume', ResumeSchema);

export default Resume;
