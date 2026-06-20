import request from 'supertest';
import app from '../app';
import User from '../models/User';

jest.mock('../models/User');

describe('Auth Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      // Mock User.findOne to return null (email not taken)
      (User.findOne as jest.Mock).mockResolvedValue(null);
      
      // Mock User.create to return a new user document
      (User.create as jest.Mock).mockResolvedValue({
        _id: 'mock_user_id_123',
        name: 'Test Candidate',
        email: 'candidate@test.com',
        targetRole: 'Software Engineer',
        experienceLevel: 'beginner',
        comparePassword: jest.fn().mockResolvedValue(true),
      });

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test Candidate',
          email: 'candidate@test.com',
          password: 'password123',
          targetRole: 'Software Engineer',
          experienceLevel: 'beginner',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe('candidate@test.com');
      expect(response.body.data.token).toBeDefined();
    });

    it('should return 400 if email is already registered', async () => {
      // Mock User.findOne to return an existing user
      (User.findOne as jest.Mock).mockResolvedValue({
        _id: 'existing_user_id',
        email: 'candidate@test.com',
      });

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test Candidate',
          email: 'candidate@test.com',
          password: 'password123',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Email already registered');
    });

    it('should return 400 if required fields are missing', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'candidate@test.com',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation Error');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login user successfully with correct credentials', async () => {
      // Mock User.findOne to return user with mock comparePassword method
      const mockComparePassword = jest.fn().mockResolvedValue(true);
      (User.findOne as jest.Mock).mockResolvedValue({
        _id: 'mock_user_id_123',
        name: 'Test Candidate',
        email: 'candidate@test.com',
        comparePassword: mockComparePassword,
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'candidate@test.com',
          password: 'password123',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBeDefined();
      expect(mockComparePassword).toHaveBeenCalledWith('password123');
    });

    it('should return 401 if password is incorrect', async () => {
      const mockComparePassword = jest.fn().mockResolvedValue(false);
      (User.findOne as jest.Mock).mockResolvedValue({
        _id: 'mock_user_id_123',
        email: 'candidate@test.com',
        comparePassword: mockComparePassword,
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'candidate@test.com',
          password: 'wrongpassword',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid credentials');
    });
  });
});
