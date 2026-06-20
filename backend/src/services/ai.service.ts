import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import path from 'path';

const provider = process.env.AI_PROVIDER || 'openai';

// Lazily initialize clients to avoid errors when keys are missing
let openaiClient: OpenAI | null = null;
let genAIClient: GoogleGenerativeAI | null = null;

const getOpenAI = (): OpenAI => {
  if (!openaiClient) {
    openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openaiClient;
};

const getGenAI = (): GoogleGenerativeAI => {
  if (!genAIClient) {
    genAIClient = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
  }
  return genAIClient;
};

/**
 * Core AI call abstraction — routes to OpenAI or Gemini based on AI_PROVIDER env var.
 */
async function callAI(prompt: string, systemPrompt?: string): Promise<string> {
  if (provider === 'gemini') {
    const model = getGenAI().getGenerativeModel({ model: 'gemini-1.5-flash' });
    const fullPrompt = systemPrompt ? `${systemPrompt}\n\n${prompt}` : prompt;
    const result = await model.generateContent(fullPrompt);
    return result.response.text();
  } else {
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];
    if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });
    messages.push({ role: 'user', content: prompt });
    const resp = await getOpenAI().chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      temperature: 0.7,
    });
    return resp.choices[0].message.content || '';
  }
}

/**
 * Parse raw resume text into structured JSON using AI.
 */
export async function parseResume(rawText: string): Promise<any> {
  const systemPrompt = `You are a resume parsing expert. Extract structured information from the provided resume text. 
Always respond with ONLY valid JSON, no markdown, no extra text.`;

  const prompt = `Extract structured data from this resume text. Return ONLY valid JSON with exactly these fields:
{
  "skills": ["array of skills"],
  "education": [{"institution": "", "degree": "", "year": ""}],
  "experience": [{"company": "", "role": "", "duration": "", "description": ""}],
  "certifications": ["array of certification names"],
  "projects": [{"name": "", "description": "", "technologies": []}]
}

Resume Text:
${rawText.substring(0, 8000)}`; // Limit to 8000 chars to avoid token overflow

  try {
    const result = await callAI(prompt, systemPrompt);
    const jsonMatch = result.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return getDefaultResumeData();
  } catch (err) {
    console.error('parseResume AI error:', err);
    return getDefaultResumeData();
  }
}

function getDefaultResumeData() {
  return {
    skills: [],
    education: [],
    experience: [],
    certifications: [],
    projects: [],
  };
}

/**
 * Generate interview questions based on role, type, difficulty, and resume data.
 */
export async function generateQuestions(
  role: string,
  type: string,
  difficulty: string,
  resumeData?: any,
  count: number = 10
): Promise<{ text: string; type: string }[]> {
  const skills =
    resumeData?.skills?.length > 0 ? resumeData.skills.join(', ') : 'general professional skills';

  const experience =
    resumeData?.experience?.length > 0
      ? resumeData.experience.map((e: any) => `${e.role} at ${e.company}`).join(', ')
      : 'general work experience';

  const systemPrompt = `You are an expert technical interviewer with 15+ years of experience. 
Generate realistic, thoughtful interview questions. Always respond with ONLY valid JSON array, no markdown.`;

  const prompt = `Generate exactly ${count} interview questions for a ${difficulty} level ${role} candidate.

Interview Type: ${type}
Candidate Skills: ${skills}
Candidate Experience: ${experience}

Requirements:
- Mix question types appropriately for the interview type
- For "technical" type: focus on technical skills, problem-solving, code design
- For "behavioral" type: use STAR method questions about past experiences
- For "hr" type: ask about motivation, culture fit, goals
- For "mixed" type: combine all types

Return ONLY a JSON array:
[
  {"text": "question text here", "type": "behavioral|technical|hr"},
  ...
]

Generate exactly ${count} questions.`;

  try {
    const result = await callAI(prompt, systemPrompt);
    const jsonMatch = result.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const questions = JSON.parse(jsonMatch[0]);
      if (Array.isArray(questions) && questions.length > 0) {
        return questions.slice(0, count);
      }
    }
    return getDefaultQuestions(role, count);
  } catch (err) {
    console.error('generateQuestions AI error:', err);
    return getDefaultQuestions(role, count);
  }
}

function getDefaultQuestions(role: string, count: number) {
  const defaults = [
    { text: `Tell me about yourself and your background in ${role}.`, type: 'hr' },
    { text: 'What are your greatest professional strengths?', type: 'hr' },
    { text: 'Describe a challenging project you worked on and how you handled it.', type: 'behavioral' },
    { text: 'Where do you see yourself in 5 years?', type: 'hr' },
    { text: 'How do you prioritize tasks when you have multiple deadlines?', type: 'behavioral' },
    { text: 'Describe a situation where you had to learn a new technology quickly.', type: 'behavioral' },
    { text: 'What do you know about our company and why do you want to work here?', type: 'hr' },
    { text: 'Describe your problem-solving process.', type: 'technical' },
    { text: 'How do you handle feedback and criticism?', type: 'behavioral' },
    { text: 'What are your salary expectations?', type: 'hr' },
  ];
  return defaults.slice(0, count);
}

/**
 * Evaluate an interview answer and return a detailed score breakdown.
 */
export async function evaluateAnswer(
  question: string,
  answer: string,
  role: string,
  difficulty: string
): Promise<any> {
  if (!answer || answer.trim().length < 10) {
    return getDefaultEvaluation();
  }

  const systemPrompt = `You are an expert interview coach evaluating candidate responses. 
Be constructive, specific, and actionable in your feedback. Always respond with ONLY valid JSON.`;

  const prompt = `Evaluate this interview answer for a ${difficulty} level ${role} position.

Question: ${question}
Answer: ${answer}

Score the answer on these dimensions (0-100 each):
- score: overall score
- relevance: how relevant to the question
- clarity: how clear and well-structured
- communication: quality of communication
- technicalAccuracy: technical correctness (if applicable)
- confidence: apparent confidence and conviction

Also provide specific feedback.

Return ONLY this JSON:
{
  "score": 0-100,
  "relevance": 0-100,
  "clarity": 0-100,
  "communication": 0-100,
  "technicalAccuracy": 0-100,
  "confidence": 0-100,
  "strengths": ["specific strength 1", "specific strength 2"],
  "improvements": ["specific improvement 1", "specific improvement 2"]
}`;

  try {
    const result = await callAI(prompt, systemPrompt);
    const jsonMatch = result.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const evaluation = JSON.parse(jsonMatch[0]);
      // Validate all required fields exist
      if (typeof evaluation.score === 'number') {
        return {
          score: Math.min(100, Math.max(0, evaluation.score || 70)),
          relevance: Math.min(100, Math.max(0, evaluation.relevance || 70)),
          clarity: Math.min(100, Math.max(0, evaluation.clarity || 70)),
          communication: Math.min(100, Math.max(0, evaluation.communication || 70)),
          technicalAccuracy: Math.min(100, Math.max(0, evaluation.technicalAccuracy || 70)),
          confidence: Math.min(100, Math.max(0, evaluation.confidence || 70)),
          strengths: Array.isArray(evaluation.strengths) ? evaluation.strengths : ['Good attempt'],
          improvements: Array.isArray(evaluation.improvements)
            ? evaluation.improvements
            : ['Be more specific'],
        };
      }
    }
    return getDefaultEvaluation();
  } catch (err) {
    console.error('evaluateAnswer AI error:', err);
    return getDefaultEvaluation();
  }
}

function getDefaultEvaluation() {
  return {
    score: 70,
    relevance: 70,
    clarity: 70,
    communication: 70,
    technicalAccuracy: 70,
    confidence: 70,
    strengths: ['Good attempt at the question'],
    improvements: ['Provide more specific examples', 'Structure your answer more clearly'],
  };
}

/**
 * Transcribe audio file to text using OpenAI Whisper or Gemini.
 */
export async function transcribeAudio(audioFilePath: string): Promise<string> {
  if (!fs.existsSync(audioFilePath)) {
    throw new Error(`Audio file not found: ${audioFilePath}`);
  }

  if (provider === 'gemini') {
    try {
      const model = getGenAI().getGenerativeModel({ model: 'gemini-1.5-flash' });
      const audioData = fs.readFileSync(audioFilePath);
      const base64Audio = audioData.toString('base64');
      const ext = path.extname(audioFilePath).slice(1).toLowerCase();
      const mimeTypeMap: Record<string, string> = {
        mp3: 'audio/mpeg',
        wav: 'audio/wav',
        m4a: 'audio/mp4',
        webm: 'audio/webm',
        ogg: 'audio/ogg',
      };
      const mimeType = mimeTypeMap[ext] || 'audio/webm';

      const result = await model.generateContent([
        {
          inlineData: { data: base64Audio, mimeType },
        },
        'Please transcribe this audio recording exactly as spoken. Return only the transcription text, no additional commentary.',
      ]);
      return result.response.text().trim();
    } catch (err) {
      console.error('Gemini transcription error:', err);
      return '[Transcription unavailable]';
    }
  } else {
    try {
      const resp = await getOpenAI().audio.transcriptions.create({
        file: fs.createReadStream(audioFilePath) as any,
        model: 'whisper-1',
        language: 'en',
      });
      return resp.text.trim();
    } catch (err) {
      console.error('Whisper transcription error:', err);
      return '[Transcription unavailable]';
    }
  }
}
