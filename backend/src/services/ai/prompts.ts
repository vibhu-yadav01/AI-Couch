import { IResumeParsedData } from '../../types';

export interface PromptPair {
  system: string;
  user: string;
}

export function resumePrompt(rawText: string): PromptPair {
  return {
    system:
      'You are a resume parsing expert. Extract structured information from the provided resume text. ' +
      'Always respond with ONLY valid JSON, no markdown, no extra text.',
    user: `Extract structured data from this resume text. Return ONLY valid JSON with exactly these fields:
{
  "skills": ["array of skills"],
  "education": [{"institution": "", "degree": "", "year": ""}],
  "experience": [{"company": "", "role": "", "duration": "", "description": ""}],
  "certifications": ["array of certification names"],
  "projects": [{"name": "", "description": "", "technologies": []}]
}

Rules:
- Extract every skill, education entry, work experience, certification, and project actually present in the text.
- Only leave an array empty if that information is genuinely absent from the resume.
- Do not invent information that is not in the text.

Resume Text:
${rawText.substring(0, 8000)}`,
  };
}

export function questionsPrompt(
  role: string,
  type: string,
  difficulty: string,
  resumeData: IResumeParsedData | undefined,
  count: number
): PromptPair {
  const skills =
    resumeData?.skills && resumeData.skills.length > 0
      ? resumeData.skills.join(', ')
      : 'general professional skills';

  const experience =
    resumeData?.experience && resumeData.experience.length > 0
      ? resumeData.experience.map((e) => `${e.role} at ${e.company}`).join(', ')
      : 'general work experience';

  return {
    system:
      'You are an expert technical interviewer with 15+ years of experience. ' +
      'Generate realistic, thoughtful interview questions tailored specifically to the role, ' +
      'difficulty, and candidate background. Always respond with ONLY a valid JSON array, no markdown.',
    user: `Generate exactly ${count} interview questions for a ${difficulty} level ${role} candidate.

Interview Type: ${type}
Candidate Skills: ${skills}
Candidate Experience: ${experience}

Requirements:
- Questions MUST be specific to the "${role}" role — a Data Analyst, Software Engineer, and Product Manager should receive clearly different questions.
- Calibrate difficulty to "${difficulty}".
- For "technical" type: focus on role-specific technical skills, problem-solving, and design.
- For "behavioral" type: use STAR-method questions about past experiences.
- For "hr" type: ask about motivation, culture fit, and goals.
- For "mixed" type: combine the above.

Return ONLY a JSON array:
[
  {"text": "question text here", "type": "behavioral|technical|hr"}
]

Generate exactly ${count} questions.`,
  };
}

export function evaluationPrompt(
  question: string,
  answer: string,
  role: string,
  difficulty: string
): PromptPair {
  return {
    system:
      'You are an expert interview coach evaluating candidate responses. Be constructive, specific, ' +
      'and actionable. Score strictly and honestly so that weak answers score low and strong answers ' +
      'score high. Always respond with ONLY valid JSON.',
    user: `Evaluate this interview answer for a ${difficulty} level ${role} position.

Question: ${question}
Answer: ${answer}

Score the answer on these dimensions (0-100 each), scoring honestly based on actual quality:
- score: overall score
- relevance: how relevant to the question
- clarity: how clear and well-structured
- communication: quality of communication
- technicalAccuracy: technical correctness (if applicable)
- confidence: apparent confidence and conviction

A poor/empty/irrelevant answer should score low (0-50). An average answer should score moderate (55-80). An excellent, specific, well-structured answer should score high (85-100).

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
}`,
  };
}
