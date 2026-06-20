# AI Interview Coach API Requests & Responses Examples

This document lists sample request payloads and successful JSON responses for all REST API endpoints.

---

## 1. Authentication

### POST `/api/auth/register`
Creates a new user profile.

* **Request Headers:**
  `Content-Type: application/json`

* **Request Body:**
  ```json
  {
    "name": "Jane Doe",
    "email": "janedoe@example.com",
    "password": "securePassword123",
    "targetRole": "React Native Developer",
    "experienceLevel": "intermediate"
  }
  ```

* **Response (201 Created):**
  ```json
  {
    "success": true,
    "message": "User registered successfully",
    "data": {
      "user": {
        "id": "65b9f71c4c3e8e24c52210a0",
        "name": "Jane Doe",
        "email": "janedoe@example.com",
        "targetRole": "React Native Developer",
        "experienceLevel": "intermediate"
      },
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
  ```

### POST `/api/auth/login`
Authenticates a user and returns a token.

* **Request Headers:**
  `Content-Type: application/json`

* **Request Body:**
  ```json
  {
    "email": "janedoe@example.com",
    "password": "securePassword123"
  }
  ```

* **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Login successful",
    "data": {
      "user": {
        "id": "65b9f71c4c3e8e24c52210a0",
        "name": "Jane Doe",
        "email": "janedoe@example.com",
        "targetRole": "React Native Developer",
        "experienceLevel": "intermediate",
        "resumeUrl": "http://localhost:5000/uploads/resumes/resume_1718919100.pdf"
      },
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
  ```

### GET `/api/auth/profile`
Retrieves the logged-in user profile.

* **Request Headers:**
  `Authorization: Bearer <jwt_token>`

* **Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "id": "65b9f71c4c3e8e24c52210a0",
      "name": "Jane Doe",
      "email": "janedoe@example.com",
      "targetRole": "React Native Developer",
      "experienceLevel": "intermediate",
      "resumeUrl": "http://localhost:5000/uploads/resumes/resume_1718919100.pdf"
    }
  }
  ```

### PUT `/api/auth/profile`
Updates profile settings.

* **Request Headers:**
  `Authorization: Bearer <jwt_token>`
  `Content-Type: application/json`

* **Request Body:**
  ```json
  {
    "name": "Jane Smith",
    "targetRole": "Senior React Native Developer",
    "experienceLevel": "advanced"
  }
  ```

* **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Profile updated successfully",
    "data": {
      "id": "65b9f71c4c3e8e24c52210a0",
      "name": "Jane Smith",
      "email": "janedoe@example.com",
      "targetRole": "Senior React Native Developer",
      "experienceLevel": "advanced",
      "resumeUrl": "http://localhost:5000/uploads/resumes/resume_1718919100.pdf"
    }
  }
  ```

---

## 2. Resume Module

### POST `/api/resume/upload`
Uploads and parses a PDF or DOCX resume.

* **Request Headers:**
  `Authorization: Bearer <jwt_token>`
  `Content-Type: multipart/form-data`

* **Request Body (form-data):**
  `resume`: [File upload binary: `resume.pdf`]

* **Response (201 Created):**
  ```json
  {
    "success": true,
    "message": "Resume parsed and saved successfully",
    "data": {
      "resumeId": "65b9f71c4c3e8e24c52210b1",
      "fileUrl": "http://localhost:5000/uploads/resumes/resume_1718919100.pdf",
      "parsedData": {
        "skills": ["React Native", "TypeScript", "JavaScript", "Redux", "Jest"],
        "education": [
          { "institution": "State University", "degree": "B.S. Computer Science", "year": "2022" }
        ],
        "experience": [
          { "company": "Software Lab", "role": "Frontend Developer", "duration": "2 years", "description": "Built responsive mobile and web layouts." }
        ],
        "certifications": ["React Native Advanced Certificate"],
        "projects": [
          { "name": "E-Commerce App", "description": "Developed dynamic shopping checkout module.", "technologies": ["React Native", "Redux"] }
        ]
      }
    }
  }
  ```

### GET `/api/resume`
Retrieves the parsed resume profile.

* **Request Headers:**
  `Authorization: Bearer <jwt_token>`

* **Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "_id": "65b9f71c4c3e8e24c52210b1",
      "userId": "65b9f71c4c3e8e24c52210a0",
      "parsedData": {
        "skills": ["React Native", "TypeScript", "JavaScript", "Redux", "Jest"],
        "education": [
          { "institution": "State University", "degree": "B.S. Computer Science", "year": "2022" }
        ],
        "experience": [
          { "company": "Software Lab", "role": "Frontend Developer", "duration": "2 years", "description": "Built responsive mobile and web layouts." }
        ],
        "certifications": ["React Native Advanced Certificate"],
        "projects": [
          { "name": "E-Commerce App", "description": "Developed dynamic shopping checkout module.", "technologies": ["React Native", "Redux"] }
        ]
      },
      "rawText": "Resume text...",
      "uploadedAt": "2026-06-20T19:12:00.000Z"
    }
  }
  ```

---

## 3. Interview Module

### POST `/api/interview/start`
Starts a mock interview session and returns the first question.

* **Request Headers:**
  `Authorization: Bearer <jwt_token>`
  `Content-Type: application/json`

* **Request Body:**
  ```json
  {
    "role": "React Native Developer",
    "type": "technical",
    "difficulty": "intermediate",
    "duration": 5
  }
  ```

* **Response (201 Created):**
  ```json
  {
    "success": true,
    "message": "Interview session started",
    "data": {
      "interviewId": "65b9f71c4c3e8e24c52210c4",
      "role": "React Native Developer",
      "type": "technical",
      "difficulty": "intermediate",
      "totalQuestions": 5,
      "firstQuestion": {
        "text": "What is the difference between Hot Reloading and Live Reloading in React Native?",
        "type": "technical"
      }
    }
  }
  ```

### POST `/api/interview/answer`
Submits a question answer (can be text response or voice audio).

#### Example A: Text Response
* **Request Headers:**
  `Authorization: Bearer <jwt_token>`
  `Content-Type: application/json`

* **Request Body:**
  ```json
  {
    "interviewId": "65b9f71c4c3e8e24c52210c4",
    "answerText": "Live reloading reloads the entire application, while hot reloading only refreshes the modified files without losing app state.",
    "type": "text"
  }
  ```

* **Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "interview": {
        "_id": "65b9f71c4c3e8e24c52210c4",
        "status": "in-progress",
        "score": 0
      },
      "isCompleted": false,
      "evaluation": {
        "score": 90,
        "relevance": 92,
        "clarity": 88,
        "communication": 90,
        "technicalAccuracy": 92,
        "confidence": 85,
        "strengths": ["Accurately identifies state preservation difference"],
        "improvements": ["Could mention Metro Bundler role"]
      },
      "nextQuestion": {
        "text": "Explain how React Native bridges javascript code to native platform UI.",
        "type": "technical"
      },
      "questionIndex": 0
    }
  }
  ```

#### Example B: Voice Response
* **Request Headers:**
  `Authorization: Bearer <jwt_token>`
  `Content-Type: multipart/form-data`

* **Request Body (form-data):**
  `audio`: [File upload binary: `answer_0.m4a`]
  `interviewId`: "65b9f71c4c3e8e24c52210c4"
  `duration`: 22.5
  `type`: "voice"

* **Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "interview": {
        "_id": "65b9f71c4c3e8e24c52210c4",
        "status": "in-progress"
      },
      "isCompleted": false,
      "transcription": "Live reloading reloads the whole app, um, whereas hot reloading only reloads the file, like, preserving the state.",
      "speechAnalysis": {
        "confidenceScore": 85,
        "fillerWordCount": 2,
        "speechRate": 135,
        "pauseCount": 2,
        "fillerWords": ["um", "like"],
        "totalDuration": 22.5
      },
      "evaluation": {
        "score": 82,
        "relevance": 85,
        "clarity": 80,
        "communication": 82,
        "technicalAccuracy": 85,
        "confidence": 80,
        "strengths": ["Clear state distinction explained"],
        "improvements": ["Reduce pause hesitations and filler words"]
      },
      "nextQuestion": {
        "text": "Explain how React Native bridges javascript code to native platform UI.",
        "type": "technical"
      },
      "questionIndex": 0
    }
  }
  ```

### POST `/api/interview/complete`
Explicitly completes the interview and produces final statistics.

* **Request Headers:**
  `Authorization: Bearer <jwt_token>`
  `Content-Type: application/json`

* **Request Body:**
  ```json
  {
    "interviewId": "65b9f71c4c3e8e24c52210c4"
  }
  ```

* **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Interview session completed",
    "data": {
      "_id": "65b9f71c4c3e8e24c52210c4",
      "userId": "65b9f71c4c3e8e24c52210a0",
      "role": "React Native Developer",
      "score": 86,
      "status": "completed",
      "answers": [
        {
          "questionIndex": 0,
          "questionText": "What is the difference between Hot Reloading and Live Reloading?",
          "answerText": "Answer text...",
          "evaluation": { "score": 86, "confidence": 85 }
        }
      ]
    }
  }
  ```

### GET `/api/interview/history`
Retrieves past interview sessions for the logged-in user.

* **Request Headers:**
  `Authorization: Bearer <jwt_token>`

* **Response (200 OK):**
  ```json
  {
    "success": true,
    "data": [
      {
        "_id": "65b9f71c4c3e8e24c52210c4",
        "role": "React Native Developer",
        "type": "technical",
        "difficulty": "intermediate",
        "score": 86,
        "status": "completed",
        "createdAt": "2026-06-20T19:22:00.000Z"
      }
    ]
  }
  ```

---

## 4. Analytics

### GET `/api/analytics/dashboard`
Returns aggregated analytics metrics for the dashboard.

* **Request Headers:**
  `Authorization: Bearer <jwt_token>`

* **Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "totalInterviews": 12,
      "averageScore": 84,
      "skillScores": {
        "communication": 82,
        "technical": 86,
        "behavioral": 80,
        "leadership": 78
      },
      "confidenceTrend": [
        { "date": "Jun 10", "score": 75 },
        { "date": "Jun 15", "score": 82 },
        { "date": "Jun 20", "score": 85 }
      ],
      "scoreHistory": [
        { "date": "Jun 10", "score": 78 },
        { "date": "Jun 15", "score": 80 },
        { "date": "Jun 20", "score": 86 }
      ],
      "fillerWordTrend": [
        { "date": "Jun 10", "count": 12 },
        { "date": "Jun 15", "count": 8 },
        { "date": "Jun 20", "count": 2 }
      ],
      "recentInterviews": [
        {
          "_id": "65b9f71c4c3e8e24c52210c4",
          "role": "React Native Developer",
          "type": "technical",
          "difficulty": "intermediate",
          "score": 86,
          "status": "completed",
          "createdAt": "2026-06-20T19:22:00.000Z"
        }
      ]
    }
  }
  ```
