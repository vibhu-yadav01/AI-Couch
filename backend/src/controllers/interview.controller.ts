import { Response } from 'express';
import Interview from '../models/Interview';
import Resume from '../models/Resume';
import Analytics from '../models/Analytics';
import User from '../models/User';
import * as aiService from '../services/ai.service';
import * as speechService from '../services/speech.service';
import * as storageService from '../services/storage.service';
import { AuthRequest } from '../types';

// POST /api/interview/start
export const startInterview = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { role, type, difficulty, duration } = req.body;

    if (!role || !type || !difficulty) {
      res.status(400).json({ success: false, error: 'Role, type, and difficulty are required' });
      return;
    }

    // Get user's resume parsed data if exists
    const resumeQuery = Resume.findOne({ userId: req.user?.id });
    const resume = resumeQuery && typeof (resumeQuery as any).sort === 'function'
      ? await (resumeQuery as any).sort({ uploadedAt: -1 })
      : await resumeQuery;
    const resumeData = resume ? resume.parsedData : undefined;

    // Number of questions: roughly 1 question per minute of duration, minimum 3, maximum 10
    const count = Math.min(10, Math.max(3, Math.ceil(duration || 5)));

    // Generate questions via AI service
    const questions = await aiService.generateQuestions(role, type, difficulty, resumeData, count);

    if (!questions || questions.length === 0) {
      res.status(500).json({ success: false, error: 'Failed to generate interview questions. Please try again.' });
      return;
    }

    // Create interview record
    const interview = await Interview.create({
      userId: req.user?.id,
      role,
      type,
      difficulty,
      duration: duration || 5,
      questions,
      answers: [],
      score: 0,
      status: 'in-progress'
    });

    res.status(201).json({
      success: true,
      message: 'Interview session started',
      data: {
        interviewId: interview._id,
        role: interview.role,
        type: interview.type,
        difficulty: interview.difficulty,
        totalQuestions: interview.questions.length,
        firstQuestion: interview.questions[0]
      }
    });
  } catch (err: any) {
    console.error('Start interview error:', err?.category ? `[${err.category}] ${err.message}` : err);
    res.status(err?.status || 500).json({ success: false, error: err.message || 'Server error' });
  }
};

// POST /api/interview/:interviewId/answer/text
export const submitTextAnswer = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const interviewId = req.params.interviewId || req.body.interviewId;
    const { answerText } = req.body;

    if (!interviewId || answerText === undefined) {
      res.status(400).json({ success: false, error: 'Interview ID and answer text are required' });
      return;
    }

    const interview = await Interview.findOne({ _id: interviewId, userId: req.user?.id });
    if (!interview) {
      res.status(404).json({ success: false, error: 'Interview session not found' });
      return;
    }

    if (interview.status === 'completed') {
      res.status(400).json({ success: false, error: 'Interview session is already completed' });
      return;
    }

    const questionIndex = interview.answers.length;
    if (questionIndex >= interview.questions.length) {
      res.status(400).json({ success: false, error: 'All questions have already been answered' });
      return;
    }

    const question = interview.questions[questionIndex];

    // Evaluate answer using AI
    const evaluation = await aiService.evaluateAnswer(
      question.text,
      answerText,
      interview.role,
      interview.difficulty
    );

    // Save answer
    const answerObj = {
      questionIndex,
      questionText: question.text,
      answerText,
      evaluation
    };

    interview.answers.push(answerObj);

    const isLastQuestion = interview.answers.length === interview.questions.length;
    let nextQuestion = null;

    if (isLastQuestion) {
      // Calculate overall score (average of all answer scores)
      const totalScore = interview.answers.reduce((acc, ans) => acc + (ans.evaluation?.score || 0), 0);
      interview.score = Math.round(totalScore / interview.answers.length);
      interview.status = 'completed';
      await interview.save();

      // Create analytics
      await saveAnalytics(interview);
    } else {
      nextQuestion = interview.questions[interview.answers.length];
      await interview.save();
    }

    res.json({
      success: true,
      data: {
        interview,
        isCompleted: isLastQuestion,
        evaluation,
        nextQuestion,
        questionIndex: interview.answers.length - 1
      }
    });
  } catch (err: any) {
    console.error('Submit text answer error:', err?.category ? `[${err.category}] ${err.message}` : err);
    res.status(err?.status || 500).json({ success: false, error: err.message || 'Server error' });
  }
};

// POST /api/interview/:interviewId/answer/voice
export const submitVoiceAnswer = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const interviewId = req.params.interviewId || req.body.interviewId;
    const duration = req.body.duration ? parseFloat(req.body.duration) : 30;

    console.log('[submitVoiceAnswer] Voice answer upload request received:', {
      interviewId,
      params: req.params,
      body: req.body,
      file: req.file ? {
        fieldname: req.file.fieldname,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        path: req.file.path
      } : null
    });

    if (!interviewId) {
      console.warn('[submitVoiceAnswer] 400 Rejection Reason: Missing interviewId');
      res.status(400).json({ success: false, error: 'Interview ID is required' });
      return;
    }

    if (!req.file) {
      console.warn('[submitVoiceAnswer] 400 Rejection Reason: No uploaded file (req.file is undefined)');
      res.status(400).json({ success: false, error: 'No audio file uploaded' });
      return;
    }

    const interview = await Interview.findOne({ _id: interviewId, userId: req.user?.id });
    if (!interview) {
      console.warn(`[submitVoiceAnswer] 404 Rejection Reason: Interview not found for id=${interviewId}`);
      res.status(404).json({ success: false, error: 'Interview session not found' });
      return;
    }

    if (interview.status === 'completed') {
      console.warn(`[submitVoiceAnswer] 400 Rejection Reason: Interview session is already completed for id=${interviewId}`);
      res.status(400).json({ success: false, error: 'Interview session is already completed' });
      return;
    }

    const questionIndex = interview.answers.length;
    if (questionIndex >= interview.questions.length) {
      console.warn(`[submitVoiceAnswer] 400 Rejection Reason: All questions have already been answered for id=${interviewId}`);
      res.status(400).json({ success: false, error: 'All questions have already been answered' });
      return;
    }

    const question = interview.questions[questionIndex];
    const localPath = req.file.path;

    // Transcribe audio using AI
    const transcription = await aiService.transcribeAudio(localPath);

    // Analyze speech characteristics (filler words, rate, pauses)
    const speechAnalysis = speechService.analyzeSpeech(transcription, duration);

    // Evaluate answer content
    const evaluation = await aiService.evaluateAnswer(
      question.text,
      transcription,
      interview.role,
      interview.difficulty
    );

    // Upload audio file to storage provider
    const audioUrl = await storageService.uploadFile(
      localPath,
      `audio/${req.file.filename}`,
      req.file.mimetype
    );

    // Save answer
    const answerObj = {
      questionIndex,
      questionText: question.text,
      answerText: transcription,
      audioUrl,
      speechAnalysis,
      evaluation
    };

    interview.answers.push(answerObj);

    const isLastQuestion = interview.answers.length === interview.questions.length;
    let nextQuestion = null;

    if (isLastQuestion) {
      // Calculate overall score (average of all answer scores)
      const totalScore = interview.answers.reduce((acc, ans) => acc + (ans.evaluation?.score || 0), 0);
      interview.score = Math.round(totalScore / interview.answers.length);
      interview.status = 'completed';
      await interview.save();

      // Create analytics
      await saveAnalytics(interview);
    } else {
      nextQuestion = interview.questions[interview.answers.length];
      await interview.save();
    }

    res.json({
      success: true,
      data: {
        interview,
        isCompleted: isLastQuestion,
        transcription,
        speechAnalysis,
        evaluation,
        nextQuestion,
        questionIndex: interview.answers.length - 1
      }
    });
  } catch (err: any) {
    console.error('Submit voice answer error:', err?.category ? `[${err.category}] ${err.message}` : err);
    res.status(err?.status || 500).json({ success: false, error: err.message || 'Server error' });
  }
};

// GET /api/interview/history
export const getInterviewHistory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const interviews = await Interview.find({ userId: req.user?.id })
      .sort({ createdAt: -1 })
      .limit(20);

    res.json({ success: true, data: interviews });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Server error' });
  }
};

// GET /api/interview/:id
export const getInterview = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const interview = await Interview.findOne({ _id: req.params.id, userId: req.user?.id });
    if (!interview) {
      res.status(404).json({ success: false, error: 'Interview not found' });
      return;
    }
    res.json({ success: true, data: interview });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Server error' });
  }
};

// Helper to save aggregates to analytics collection
const saveAnalytics = async (interview: any): Promise<void> => {
  try {
    const numAnswers = interview.answers.length;
    if (numAnswers === 0) return;

    let totalConfidence = 0;
    let totalFillerCount = 0;
    let totalCommunication = 0;
    let totalTechnical = 0;
    let totalBehavioral = 0;
    let totalLeadership = 0;

    interview.answers.forEach((ans: any) => {
      totalConfidence += ans.evaluation?.confidence || 0;
      totalCommunication += ans.evaluation?.communication || 0;
      totalTechnical += ans.evaluation?.technicalAccuracy || 0;
      totalBehavioral += ans.evaluation?.relevance || 0;
      totalLeadership += ans.evaluation?.clarity || 0;

      if (ans.speechAnalysis) {
        totalFillerCount += ans.speechAnalysis.fillerWordCount || 0;
      }
    });

    const confidenceScore = Math.round(totalConfidence / numAnswers);
    const communicationScore = Math.round(totalCommunication / numAnswers);
    const technicalScore = Math.round(totalTechnical / numAnswers);
    const behavioralScore = Math.round(totalBehavioral / numAnswers);
    const leadershipScore = Math.round(totalLeadership / numAnswers);

    await Analytics.create({
      userId: interview.userId,
      interviewId: interview._id,
      confidenceScore,
      fillerWordCount: totalFillerCount,
      communicationScore,
      technicalScore,
      behavioralScore,
      leadershipScore,
      overallScore: interview.score
    });
  } catch (err) {
    console.error('Failed to save interview analytics:', err);
  }
};

// POST /api/interview/answer
export const submitAnswer = async (req: AuthRequest, res: Response): Promise<void> => {
  if (req.file || req.body.type === 'voice') {
    return submitVoiceAnswer(req, res);
  } else {
    return submitTextAnswer(req, res);
  }
};

// POST /api/interview/complete
export const completeInterview = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const interviewId = req.body.interviewId;
    if (!interviewId) {
      res.status(400).json({ success: false, error: 'Interview ID is required' });
      return;
    }
    const interview = await Interview.findOne({ _id: interviewId, userId: req.user?.id });
    if (!interview) {
      res.status(404).json({ success: false, error: 'Interview session not found' });
      return;
    }
    if (interview.status === 'completed') {
      res.json({ success: true, message: 'Interview already completed', data: interview });
      return;
    }
    interview.status = 'completed';
    if (interview.answers.length > 0) {
      const totalScore = interview.answers.reduce((acc, ans) => acc + (ans.evaluation?.score || 0), 0);
      interview.score = Math.round(totalScore / interview.answers.length);
    } else {
      interview.score = 0;
    }
    await interview.save();
    await saveAnalytics(interview);
    res.json({
      success: true,
      message: 'Interview session completed',
      data: interview
    });
  } catch (err: any) {
    console.error('Complete interview error:', err);
    res.status(500).json({ success: false, error: err.message || 'Server error' });
  }
};

