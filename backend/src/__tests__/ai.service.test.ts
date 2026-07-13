import * as aiService from '../services/ai.service';

// Mock OpenAI client
jest.mock('openai', () => {
  class MockOpenAI {
    chat = {
      completions: {
        create: jest.fn().mockImplementation(async (options: any) => {
          const lastMessage = options.messages[options.messages.length - 1];
          const prompt = lastMessage?.content || '';
          
          if (prompt.includes('Extract structured data') || prompt.includes('Resume Text') || prompt.includes('resume')) {
            return {
              choices: [{
                message: {
                  content: JSON.stringify({
                    skills: ['TypeScript', 'Node.js'],
                    education: [{ institution: 'Test Uni', degree: 'CS', year: '2024' }],
                    experience: [{ company: 'Stark Corp', role: 'Developer', duration: '2 yrs', description: 'Built Jarvis' }],
                    certifications: ['AWS Cloud Practitioner'],
                    projects: [{ name: 'Project A', description: 'Cool project', technologies: ['React'] }],
                  })
                }
              }]
            };
          } else if (prompt.includes('Evaluate') || prompt.includes('answer')) {
            return {
              choices: [{
                message: {
                  content: JSON.stringify({
                    score: 85,
                    relevance: 80,
                    clarity: 90,
                    communication: 85,
                    technicalAccuracy: 85,
                    confidence: 85,
                    strengths: ['Clear answer'],
                    improvements: ['Could be more detailed'],
                  })
                }
              }]
            };
          } else {
            return {
              choices: [{
                message: {
                  content: JSON.stringify([
                    { text: 'What is polymorphism?', type: 'technical' },
                    { text: 'Describe a time you failed.', type: 'behavioral' }
                  ])
                }
              }]
            };
          }
        }),
      },
    };
  }
  return {
    __esModule: true,
    default: MockOpenAI,
  };
});

// Mock Gemini Generative AI client
jest.mock('@google/generative-ai', () => {
  class MockGoogleGenerativeAI {
    getGenerativeModel() {
      return {
        generateContent: jest.fn().mockImplementation(async (contents: any) => {
          let prompt = '';
          if (typeof contents === 'string') {
            prompt = contents;
          } else if (Array.isArray(contents)) {
            prompt = contents.map(c => typeof c === 'string' ? c : JSON.stringify(c)).join(' ');
          } else {
            prompt = JSON.stringify(contents);
          }
          
          const resText = () => {
            if (prompt.includes('Extract structured data') || prompt.includes('Resume Text') || prompt.includes('resume')) {
              return JSON.stringify({
                skills: ['TypeScript', 'Node.js'],
                education: [{ institution: 'Test Uni', degree: 'CS', year: '2024' }],
                experience: [{ company: 'Stark Corp', role: 'Developer', duration: '2 yrs', description: 'Built Jarvis' }],
                certifications: ['AWS Cloud Practitioner'],
                projects: [{ name: 'Project A', description: 'Cool project', technologies: ['React'] }],
              });
            } else if (prompt.includes('Evaluate') || prompt.includes('answer')) {
              return JSON.stringify({
                score: 85,
                relevance: 80,
                clarity: 90,
                communication: 85,
                technicalAccuracy: 85,
                confidence: 85,
                strengths: ['Clear answer'],
                improvements: ['Could be more detailed'],
              });
            } else {
              return JSON.stringify([
                { text: 'What is polymorphism?', type: 'technical' },
                { text: 'Describe a time you failed.', type: 'behavioral' }
              ]);
            }
          };
          
          return {
            response: {
              text: resText,
            },
          };
        }),
      };
    }
  }
  return {
    __esModule: true,
    GoogleGenerativeAI: MockGoogleGenerativeAI,
  };
});

describe('AI Interfacing Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('parseResume', () => {
    it('should invoke callAI and return structured JSON object', async () => {
      const result = await aiService.parseResume('This is my resume. I know TypeScript.');
      expect(result).toHaveProperty('skills');
      expect(result.skills).toContain('TypeScript');
      expect(result.education[0].institution).toBe('Test Uni');
    });
  });

  describe('generateQuestions', () => {
    it('should return generated list of interview questions', async () => {
      // The mock returns exactly 2 questions; request count=2 so the stricter
      // "at least count" validation is satisfied (no generic default padding).
      const result = await aiService.generateQuestions('Software Engineer', 'technical', 'beginner', undefined, 2);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(2);
      expect(result[0]).toHaveProperty('text');
      expect(result[0]).toHaveProperty('type');
    });
  });
});

