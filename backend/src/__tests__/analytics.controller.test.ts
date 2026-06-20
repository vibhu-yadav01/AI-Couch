import request from 'supertest';
import app from '../app';
import Analytics from '../models/Analytics';
import Interview from '../models/Interview';

jest.mock('../models/Analytics');
jest.mock('../models/Interview');

// Mock Auth Protection Middleware to auto-authorize requests
jest.mock('../middleware/auth.middleware', () => ({
  protect: (req: any, res: any, next: any) => {
    req.user = { id: 'mock_user_id_123', email: 'candidate@test.com' };
    next();
  },
}));

describe('Analytics Controller Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/analytics/dashboard', () => {
    it('should generate stats aggregates and trends for dashboard', async () => {
      const mockRecentInterviews = [
        { _id: 'int_1', role: 'Developer', score: 85, status: 'completed', createdAt: new Date() },
      ];
      
      const mockAnalytics = [
        {
          userId: 'mock_user_id_123',
          interviewId: 'int_1',
          confidenceScore: 80,
          fillerWordCount: 2,
          communicationScore: 85,
          technicalScore: 90,
          behavioralScore: 85,
          leadershipScore: 80,
          overallScore: 85,
          createdAt: new Date(),
        },
      ];

      (Interview.countDocuments as jest.Mock).mockResolvedValue(1);
      (Analytics.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockAnalytics),
      });
      (Interview.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue(mockRecentInterviews),
        }),
      });

      const response = await request(app).get('/api/analytics/dashboard');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.totalInterviews).toBe(1);
      expect(response.body.data.averageScore).toBe(85);
      expect(response.body.data.skillScores.technical).toBe(90);
      expect(response.body.data.recentInterviews.length).toBe(1);
    });
  });

  describe('GET /api/analytics/interview/:id', () => {
    it('should fetch analytics summary for a specific interview session', async () => {
      const mockAnalyticRecord = {
        _id: 'analytics_id_abc',
        interviewId: 'int_1',
        overallScore: 85,
      };

      (Analytics.findOne as jest.Mock).mockResolvedValue(mockAnalyticRecord);

      const response = await request(app).get('/api/analytics/interview/int_1');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.overallScore).toBe(85);
      expect(Analytics.findOne).toHaveBeenCalledWith({
        interviewId: 'int_1',
        userId: 'mock_user_id_123',
      });
    });

    it('should return 404 if no analytics exist for the interview', async () => {
      (Analytics.findOne as jest.Mock).mockResolvedValue(null);

      const response = await request(app).get('/api/analytics/interview/int_missing');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Analytics for this interview not found');
    });
  });
});
