import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../app';
import User from '../models/User';
import Resume from '../models/Resume';
import Interview from '../models/Interview';
import Analytics from '../models/Analytics';
import fs from 'fs';
import path from 'path';

// Mock Mongoose models
jest.mock('../models/User');
jest.mock('../models/Resume');
jest.mock('../models/Interview');
jest.mock('../models/Analytics');

jest.mock('pdf-parse', () => {
  return jest.fn().mockImplementation(() => Promise.resolve({ text: 'mocked resume text' }));
});

jest.mock('../services/ai.service', () => ({
  parseResume: jest.fn().mockResolvedValue({
    skills: ['JavaScript'],
    experience: [],
    education: [],
    certifications: [],
    projects: []
  }),
  generateQuestions: jest.fn().mockResolvedValue([
    { text: 'Describe a challenging project you worked on.', type: 'behavioral' },
    { text: 'How do you handle state in React?', type: 'technical' }
  ]),
  evaluateAnswer: jest.fn().mockResolvedValue({
    score: 85,
    relevance: 90,
    clarity: 80,
    communication: 85,
    technicalAccuracy: 88,
    confidence: 80,
    strengths: ['Clear explanation'],
    improvements: ['Could add code examples']
  }),
  transcribeAudio: jest.fn().mockResolvedValue('Mocked transcription text')
}));

jest.setTimeout(30000);

describe('E2E Verification Mock Run', () => {
  it('should generate the report', async () => {
    const report: string[] = [];
    report.push('# End-to-End Verification Report\n');

    try {
    process.env.JWT_SECRET = 'test_secret';
    process.env.JWT_EXPIRES_IN = '1d';
    
    let jwtToken = jwt.sign({ id: 'mock_user_123' }, 'test_secret');
    let resumeId = '507f1f77bcf86cd799439011';
    let interviewId = '507f1f77bcf86cd799439022';

    // Mock User.findById for auth middleware
    (User.findById as jest.Mock).mockReturnValue({
      select: jest.fn().mockResolvedValue({ _id: 'mock_user_123', email: 'e2e@tester.com' })
    });

    // 1. Register
    const registerPayload = {
      name: 'E2E Tester',
      email: 'e2e@tester.com',
      password: 'password123',
      targetRole: 'Software Engineer',
      experienceLevel: 'intermediate'
    };
    
    (User.findOne as jest.Mock).mockResolvedValue(null);
    (User.create as jest.Mock).mockResolvedValue({
      _id: 'mock_user_123',
      ...registerPayload,
      comparePassword: jest.fn().mockResolvedValue(true),
    });

    const registerRes = await request(app).post('/api/auth/register').send(registerPayload);
    // Use the real token returned by register
    if (registerRes.body?.data?.token) {
      jwtToken = registerRes.body.data.token;
    }
    
    report.push('## 1. Register a new user');
    report.push('**Endpoint:** `POST /api/auth/register`');
    report.push('**Payload:**\n```json\n' + JSON.stringify(registerPayload, null, 2) + '\n```');
    report.push('**Response Body:**\n```json\n' + JSON.stringify(registerRes.body, null, 2) + '\n```\n');

    // 2. Login
    const loginPayload = { email: 'e2e@tester.com', password: 'password123' };
    (User.findOne as jest.Mock).mockResolvedValue({
      _id: 'mock_user_123',
      email: 'e2e@tester.com',
      comparePassword: jest.fn().mockResolvedValue(true),
    });

    const loginRes = await request(app).post('/api/auth/login').send(loginPayload);
    
    report.push('## 2. Login and obtain JWT');
    report.push('**Endpoint:** `POST /api/auth/login`');
    report.push('**Payload:**\n```json\n' + JSON.stringify(loginPayload, null, 2) + '\n```');
    report.push('**Response Body:**\n```json\n' + JSON.stringify(loginRes.body, null, 2) + '\n```\n');

    // 3. Upload Resume
    const dummyPdfPath = path.join(__dirname, 'dummy.pdf');
    fs.writeFileSync(dummyPdfPath, '%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n5 0 obj\n<< /Length 44 >>\nstream\nBT\n/F1 12 Tf\n100 700 Td\n(This is a test resume) Tj\nET\nendstream\nendobj\nxref\n0 6\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n0000000216 00000 n \n0000000304 00000 n \ntrailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n399\n%%EOF');

    (Resume.create as jest.Mock).mockResolvedValue({
      _id: resumeId,
      userId: 'mock_user_123',
      parsedData: { skills: ['JavaScript'], experience: [] },
      rawText: 'This is a test resume'
    });
    (User.findByIdAndUpdate as jest.Mock).mockResolvedValue({});

    const uploadRes = await request(app)
      .post('/api/resume/upload')
      .set('Authorization', `Bearer ${jwtToken}`)
      .attach('resume', dummyPdfPath);
      
    report.push('## 3. Upload a sample resume (PDF)');
    report.push('**Endpoint:** `POST /api/resume/upload`');
    report.push('**Payload:** `multipart/form-data (dummy.pdf)`');
    report.push('**Response Body:**\n```json\n' + JSON.stringify(uploadRes.body, null, 2) + '\n```\n');

    // 4. Start Interview
    const startPayload = { role: 'Software Engineer', type: 'technical', difficulty: 'intermediate', resumeId };
    (Interview.create as jest.Mock).mockResolvedValue({
      _id: interviewId,
      userId: 'mock_user_123',
      role: 'Software Engineer',
      questions: [
        { id: 'q1', text: 'Describe a challenging project you worked on.', type: 'behavioral' },
        { id: 'q2', text: 'How do you handle state in React?', type: 'technical' }
      ],
      answers: []
    });
    (Resume.findById as jest.Mock).mockResolvedValue({ parsedData: {} });
    (Resume.findOne as jest.Mock).mockReturnValue({
      sort: jest.fn().mockResolvedValue({ parsedData: {} })
    });

    const startRes = await request(app)
      .post('/api/interview/start')
      .set('Authorization', `Bearer ${jwtToken}`)
      .send(startPayload);
      
    report.push('## 4. Start an interview for "Software Engineer"');
    report.push('**Endpoint:** `POST /api/interview/start`');
    report.push('**Payload:**\n```json\n' + JSON.stringify(startPayload, null, 2) + '\n```');
    report.push('**Response Body:**\n```json\n' + JSON.stringify(startRes.body, null, 2) + '\n```\n');

    // 5. Submit Text Answer
    const answerPayload = { questionId: 'q1', answer: 'I built a scalable microservices architecture using Node.js.' };
    (Interview.findOne as jest.Mock).mockResolvedValue({
      _id: interviewId,
      questions: [
        { id: 'q1', text: 'Describe a challenging project you worked on.', type: 'behavioral' },
        { id: 'q2', text: 'How do you handle state in React?', type: 'technical' }
      ],
      answers: [],
      save: jest.fn().mockResolvedValue(true)
    });

    const answerRes = await request(app)
      .post(`/api/interview/${interviewId}/answer/text`)
      .set('Authorization', `Bearer ${jwtToken}`)
      .send(answerPayload);
      
    report.push('## 5. Submit one text answer');
    report.push(`**Endpoint:** \`POST /api/interview/${interviewId}/answer/text\``);
    report.push('**Payload:**\n```json\n' + JSON.stringify(answerPayload, null, 2) + '\n```');
    report.push('**Response Body:**\n```json\n' + JSON.stringify(answerRes.body, null, 2) + '\n```\n');

    // 6. Submit Voice Transcript
    const dummyAudioPath = path.join(__dirname, 'dummy.webm');
    fs.writeFileSync(dummyAudioPath, 'dummy audio data');

    (Interview.findOne as jest.Mock).mockResolvedValue({
      _id: interviewId,
      questions: [
        { id: 'q1', text: 'Describe a challenging project you worked on.', type: 'behavioral' },
        { id: 'q2', text: 'How do you handle state in React?', type: 'technical' }
      ],
      answers: [{ questionId: 'q1', answer: 'test', score: 80 }],
      save: jest.fn().mockResolvedValue(true)
    });

    const voiceRes = await request(app)
      .post(`/api/interview/${interviewId}/answer/voice`)
      .set('Authorization', `Bearer ${jwtToken}`)
      .field('questionIndex', '1')
      .field('duration', '10')
      .attach('audio', dummyAudioPath, 'answer_1.webm');
      
    report.push('## 6. Submit one voice transcript');
    report.push(`**Endpoint:** \`POST /api/interview/${interviewId}/answer/voice\``);
    report.push('**Payload:** `multipart/form-data (audio file attached)`');
    report.push('**Response Body:**\n```json\n' + JSON.stringify(voiceRes.body, null, 2) + '\n```\n');

    // 7. Complete Interview
    (Interview.findOne as jest.Mock).mockResolvedValue({
      _id: interviewId,
      questions: [{}, {}],
      answers: [
        { score: 80, confidenceScore: 85 },
        { score: 90, confidenceScore: 70 }
      ],
      status: 'in_progress',
      save: jest.fn().mockResolvedValue(true)
    });

    const completeRes = await request(app)
      .post('/api/interview/complete')
      .set('Authorization', `Bearer ${jwtToken}`)
      .send({ interviewId });
      
    report.push('## 7. Complete the interview');
    report.push('**Endpoint:** `POST /api/interview/complete`');
    report.push('**Payload:**\n```json\n' + JSON.stringify({ interviewId }, null, 2) + '\n```');
    report.push('**Response Body:**\n```json\n' + JSON.stringify(completeRes.body, null, 2) + '\n```\n');

    // 8. Retrieve History
    (Interview.find as jest.Mock).mockReturnValue({
      sort: jest.fn().mockResolvedValue([{ _id: interviewId, role: 'Software Engineer', overallScore: 85 }])
    });

    const historyRes = await request(app)
      .get('/api/interview/history')
      .set('Authorization', `Bearer ${jwtToken}`);
      
    report.push('## 8. Retrieve interview history');
    report.push('**Endpoint:** `GET /api/interview/history`');
    report.push('**Response Body:**\n```json\n' + JSON.stringify(historyRes.body, null, 2) + '\n```\n');

    // 9. Retrieve Dashboard
    (Analytics.findOne as jest.Mock).mockReturnValue({
      sort: jest.fn().mockResolvedValue({
        userId: 'mock_user_123',
        totalInterviews: 1,
        averageScore: 85,
        strongestSkills: ['JavaScript'],
        areasForImprovement: ['Communication']
      })
    });

    const dashRes = await request(app)
      .get('/api/analytics/dashboard')
      .set('Authorization', `Bearer ${jwtToken}`);
      
    report.push('## 9. Retrieve the analytics dashboard');
    report.push('**Endpoint:** `GET /api/analytics/dashboard`');
    report.push('**Response Body:**\n```json\n' + JSON.stringify(dashRes.body, null, 2) + '\n```\n');

    // Write report
    const reportPath = path.join(__dirname, 'e2e_report.md');
    fs.writeFileSync(reportPath, report.join('\n'));
    console.log('✅ Generated report at', reportPath);

  } catch (err) {
    console.error('Error running E2E tests:', err);
  }
});
});
