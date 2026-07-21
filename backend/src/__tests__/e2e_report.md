# End-to-End Verification Report

## 1. Register a new user
**Endpoint:** `POST /api/auth/register`
**Payload:**
```json
{
  "name": "E2E Tester",
  "email": "e2e@tester.com",
  "password": "password123",
  "targetRole": "Software Engineer",
  "experienceLevel": "intermediate"
}
```
**Response Body:**
```json
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Im1vY2tfdXNlcl8xMjMiLCJlbWFpbCI6ImUyZUB0ZXN0ZXIuY29tIiwiaWF0IjoxNzg0NjYwMTYxLCJleHAiOjE3ODQ3NDY1NjF9.nOrMdCWQ8hr8GHwDb2MABwyEYzVoWPCYH-Kw4ri1Yy8",
    "user": {
      "id": "mock_user_123",
      "name": "E2E Tester",
      "email": "e2e@tester.com",
      "targetRole": "Software Engineer",
      "experienceLevel": "intermediate"
    }
  }
}
```

## 2. Login and obtain JWT
**Endpoint:** `POST /api/auth/login`
**Payload:**
```json
{
  "email": "e2e@tester.com",
  "password": "password123"
}
```
**Response Body:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Im1vY2tfdXNlcl8xMjMiLCJlbWFpbCI6ImUyZUB0ZXN0ZXIuY29tIiwiaWF0IjoxNzg0NjYwMTYxLCJleHAiOjE3ODQ3NDY1NjF9.nOrMdCWQ8hr8GHwDb2MABwyEYzVoWPCYH-Kw4ri1Yy8",
    "user": {
      "id": "mock_user_123",
      "email": "e2e@tester.com"
    }
  }
}
```

## 3. Upload a sample resume (PDF)
**Endpoint:** `POST /api/resume/upload`
**Payload:** `multipart/form-data (dummy.pdf)`
**Response Body:**
```json
{
  "success": false,
  "error": "Failed to extract text from file. Please ensure the file is not corrupted."
}
```

## 4. Start an interview for "Software Engineer"
**Endpoint:** `POST /api/interview/start`
**Payload:**
```json
{
  "role": "Software Engineer",
  "type": "technical",
  "difficulty": "intermediate",
  "resumeId": "507f1f77bcf86cd799439011"
}
```
**Response Body:**
```json
{
  "success": false,
  "error": "Failed to generate interview questions. Please try again."
}
```

## 5. Submit one text answer
**Endpoint:** `POST /api/interview/507f1f77bcf86cd799439022/answer/text`
**Payload:**
```json
{
  "questionId": "q1",
  "answer": "I built a scalable microservices architecture using Node.js."
}
```
**Response Body:**
```json
{
  "success": false,
  "error": "Validation Error",
  "details": [
    {
      "field": "answerText",
      "message": "Answer text is required"
    }
  ]
}
```

## 6. Submit one voice transcript
**Endpoint:** `POST /api/interview/507f1f77bcf86cd799439022/answer/voice`
**Payload:** `multipart/form-data (audio file attached)`
**Response Body:**
```json
{
  "success": true,
  "data": {
    "interview": {
      "_id": "507f1f77bcf86cd799439022",
      "questions": [
        {
          "id": "q1",
          "text": "Describe a challenging project you worked on.",
          "type": "behavioral"
        },
        {
          "id": "q2",
          "text": "How do you handle state in React?",
          "type": "technical"
        }
      ],
      "answers": [
        {
          "questionId": "q1",
          "answer": "test",
          "score": 80
        },
        {
          "questionIndex": 1,
          "questionText": "How do you handle state in React?",
          "audioUrl": "/uploads/4f99f489-e264-475c-bfec-5fd644d98ca1.webm",
          "speechAnalysis": {
            "confidenceScore": 0,
            "fillerWordCount": 0,
            "speechRate": 0,
            "pauseCount": 0,
            "fillerWords": [],
            "totalDuration": 10
          }
        }
      ],
      "score": 0,
      "status": "completed"
    },
    "isCompleted": true,
    "speechAnalysis": {
      "confidenceScore": 0,
      "fillerWordCount": 0,
      "speechRate": 0,
      "pauseCount": 0,
      "fillerWords": [],
      "totalDuration": 10
    },
    "nextQuestion": null,
    "questionIndex": 1
  }
}
```

## 7. Complete the interview
**Endpoint:** `POST /api/interview/complete`
**Payload:**
```json
{
  "interviewId": "507f1f77bcf86cd799439022"
}
```
**Response Body:**
```json
{
  "success": true,
  "message": "Interview session completed",
  "data": {
    "_id": "507f1f77bcf86cd799439022",
    "questions": [
      {},
      {}
    ],
    "answers": [
      {
        "score": 80,
        "confidenceScore": 85
      },
      {
        "score": 90,
        "confidenceScore": 70
      }
    ],
    "status": "completed",
    "score": 0
  }
}
```

## 8. Retrieve interview history
**Endpoint:** `GET /api/interview/history`
**Response Body:**
```json
{
  "success": false,
  "error": "Interview_1.default.find(...).sort(...).limit is not a function"
}
```

## 9. Retrieve the analytics dashboard
**Endpoint:** `GET /api/analytics/dashboard`
**Response Body:**
```json
{
  "success": false,
  "error": "Cannot read properties of undefined (reading 'sort')"
}
```
