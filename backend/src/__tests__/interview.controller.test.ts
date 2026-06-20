import request from 'supertest';
import app from '../app';
import Interview from '../models/Interview';
import Resume from '../models/Resume';
import Analytics from '../models/Analytics';
import * as aiService from '../services/ai.service';
import * as storageService from '../services/storage.service';
import * as speechService from '../services/speech.service';

jest.mock('../models/Interview');
jest.mock('../models/Resume');
jest.mock('../models/Analytics');
jest.mock('../models/User');

jest.mock('../services/storage.service', () => ({
  __esModule: true,
  uploadFile: jest.fn(),
}));

jest.mock('../services/ai.service', () => ({
  __esModule: true,
  generateQuestions: jest.fn(),
  evaluateAnswer: jest.fn(),
  transcribeAudio: jest.fn(),
}));

jest.mock('../services/speech.service', () => ({
  __esModule: true,
  analyzeSpeech: jest.fn(),
}));

// Mock Auth Protection Middleware to auto-authorize requests
jest.mock('../middleware/auth.middleware', () => ({
  protect: (req: any, res: any, next: any) => {
    req.user = { id: '65b9f71c4c3e8e24c52210a0', email: 'candidate@test.com' };
    next();
  },
}));

describe('Interview Controller Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    (aiService.generateQuestions as jest.Mock).mockResolvedValue([
      { text: 'Question 1', type: 'technical' },
      { text: 'Question 2', type: 'behavioral' },
    ]);

    (aiService.evaluateAnswer as jest.Mock).mockResolvedValue({
      score: 85,
      relevance: 80,
      clarity: 90,
      communication: 85,
      technicalAccuracy: 85,
      confidence: 85,
      strengths: ['Clear answer'],
      improvements: ['Could be more detailed'],
    });

    (aiService.transcribeAudio as jest.Mock).mockResolvedValue('This is my speech transcription answer.');

    (storageService.uploadFile as jest.Mock).mockResolvedValue('http://mockstorage.com/audio/mock.webm');

    (speechService.analyzeSpeech as jest.Mock).mockReturnValue({
      confidenceScore: 82,
      fillerWordCount: 1,
      speechRate: 140,
      pauseCount: 2,
      fillerWords: ['um'],
      totalDuration: 20,
    });
  });

  describe('POST /api/interview/start', () => {
    it('should start a new interview session and return the first question', async () => {
      const mockInterview = {
        _id: '65b9f71c4c3e8e24c52210c4',
        userId: '65b9f71c4c3e8e24c52210a0',
        role: 'Software Engineer',
        type: 'technical',
        difficulty: 'intermediate',
        duration: 5,
        questions: [
          { text: 'Question 1', type: 'technical' },
          { text: 'Question 2', type: 'behavioral' },
        ],
        answers: [],
        score: 0,
        status: 'in-progress',
      };

      (Resume.findOne as jest.Mock).mockReturnValue({
        sort: jest.fn().mockResolvedValue(null),
      });

      (Interview.create as jest.Mock).mockResolvedValue(mockInterview);

      const response = await request(app)
        .post('/api/interview/start')
        .send({
          role: 'Software Engineer',
          type: 'technical',
          difficulty: 'intermediate',
          duration: 5,
        });

      if (response.status !== 201) {
        console.log('❌ START INTERVIEW ERROR:', response.body);
      }

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.interviewId).toBe('65b9f71c4c3e8e24c52210c4');
      expect(response.body.data.firstQuestion.text).toBe('Question 1');
    });
  });

  describe('POST /api/interview/:interviewId/answer/text', () => {
    it('should submit a text answer, evaluate it, and return next question details', async () => {
      const mockInterview = {
        _id: '65b9f71c4c3e8e24c52210c4',
        userId: '65b9f71c4c3e8e24c52210a0',
        role: 'Software Engineer',
        type: 'technical',
        difficulty: 'intermediate',
        questions: [
          { text: 'Question 1', type: 'technical' },
          { text: 'Question 2', type: 'behavioral' },
        ],
        answers: [],
        score: 0,
        status: 'in-progress',
        save: jest.fn().mockResolvedValue(true),
      };

      (Interview.findOne as jest.Mock).mockResolvedValue(mockInterview);

      const response = await request(app)
        .post('/api/interview/65b9f71c4c3e8e24c52210c4/answer/text')
        .send({
          answerText: 'This is my text-based technical response about polymorphism.',
        });

      if (response.status !== 200) {
        console.log('❌ SUBMIT ANSWER ERROR:', response.body);
      }

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.isCompleted).toBe(false);
      expect(response.body.data.evaluation.score).toBe(85);
      expect(response.body.data.nextQuestion.text).toBe('Question 2');
    });
  });

  describe('POST /api/interview/complete', () => {
    it('should complete the interview and return stats', async () => {
      const mockAnswers = [
        {
          questionIndex: 0,
          questionText: 'Question 1',
          answerText: 'Answer 1',
          evaluation: { score: 80, confidence: 80, communication: 80, technicalAccuracy: 80, relevance: 80, clarity: 80 },
        },
      ];
      const mockInterview = {
        _id: 'mock_interview_id_123',
        userId: 'mock_user_id_123',
        role: 'Software Engineer',
        status: 'in-progress',
        answers: mockAnswers,
        score: 0,
        save: jest.fn().mockResolvedValue(true),
      };

      (Interview.findOne as jest.Mock).mockResolvedValue(mockInterview);
      (Analytics.create as jest.Mock).mockResolvedValue({});

      const response = await request(app)
        .post('/api/interview/complete')
        .send({
          interviewId: 'mock_interview_id_123',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(mockInterview.status).toBe('completed');
      expect(mockInterview.score).toBe(80);
    });
  });

  describe('GET /api/interview/history', () => {
    it('should retrieve list of past interviews', async () => {
      const mockHistory = [
        { _id: 'int_1', role: 'Dev', score: 85, status: 'completed' },
        { _id: 'int_2', role: 'QA', score: 70, status: 'completed' },
      ];

      (Interview.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue(mockHistory),
        }),
      });

      const response = await request(app).get('/api/interview/history');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBe(2);
    });
  });
});
