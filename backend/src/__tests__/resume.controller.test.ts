import request from 'supertest';
import app from '../app';
import Resume from '../models/Resume';
import User from '../models/User';

jest.mock('../models/Resume');
jest.mock('../models/User');
jest.mock('../services/storage.service', () => ({
  uploadFile: jest.fn().mockResolvedValue('http://mockstorage.com/resumes/mock.pdf'),
}));
jest.mock('../services/ai.service', () => ({
  parseResume: jest.fn().mockResolvedValue({
    skills: ['NodeJS', 'MongoDB'],
    education: [],
    experience: [],
    certifications: [],
    projects: [],
  }),
}));

// Mock Auth Protection Middleware to auto-authorize requests
jest.mock('../middleware/auth.middleware', () => ({
  protect: (req: any, res: any, next: any) => {
    req.user = { id: 'mock_user_id_123', email: 'candidate@test.com' };
    next();
  },
}));

describe('Resume Controller Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/resume/me', () => {
    it('should fetch the latest resume parsed profile for user', async () => {
      const mockResume = {
        _id: 'mock_resume_id',
        userId: 'mock_user_id_123',
        parsedData: { skills: ['NodeJS', 'MongoDB'] },
        uploadedAt: new Date(),
      };

      // Mock Resume query chain
      const mockQuery: any = {
        sort: jest.fn().mockResolvedValue(mockResume),
      };
      (Resume.findOne as jest.Mock).mockReturnValue(mockQuery);

      const response = await request(app).get('/api/resume/me');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.parsedData.skills).toContain('NodeJS');
      expect(Resume.findOne).toHaveBeenCalledWith({ userId: 'mock_user_id_123' });
    });

    it('should return 404 if no resume exists for user', async () => {
      const mockQuery: any = {
        sort: jest.fn().mockResolvedValue(null),
      };
      (Resume.findOne as jest.Mock).mockReturnValue(mockQuery);

      const response = await request(app).get('/api/resume/me');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('No resume found for this user');
    });
  });

  describe('GET /api/resume/:id', () => {
    it('should retrieve specific resume by ID', async () => {
      const mockResume = {
        _id: 'mock_resume_id_999',
        userId: 'mock_user_id_123',
        parsedData: { skills: ['NodeJS'] },
      };
      (Resume.findOne as jest.Mock).mockResolvedValue(mockResume);

      const response = await request(app).get('/api/resume/mock_resume_id_999');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data._id).toBe('mock_resume_id_999');
      expect(Resume.findOne).toHaveBeenCalledWith({ _id: 'mock_resume_id_999', userId: 'mock_user_id_123' });
    });
  });
});
