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
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Im1vY2tfdXNlcl8xMjMiLCJlbWFpbCI6ImUyZUB0ZXN0ZXIuY29tIiwiaWF0IjoxNzg0MDUzNjExLCJleHAiOjE3ODQxNDAwMTF9.uG3JjLnRMcrX_RD9zIPX6-QHJJ7ag-bDLrFR25WFYnA",
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
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Im1vY2tfdXNlcl8xMjMiLCJlbWFpbCI6ImUyZUB0ZXN0ZXIuY29tIiwiaWF0IjoxNzg0MDUzNjExLCJleHAiOjE3ODQxNDAwMTF9.uG3JjLnRMcrX_RD9zIPX6-QHJJ7ag-bDLrFR25WFYnA",
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
  "resumeId": "mock_resume_123"
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
**Endpoint:** `POST /api/interview/mock_interview_456/answer/text`
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
      "field": "interviewId",
      "message": "Invalid Interview ID"
    },
    {
      "field": "answerText",
      "message": "Answer text is required"
    }
  ]
}
```

## 6. Submit one voice transcript
**Endpoint:** `POST /api/interview/mock_interview_456/answer/voice`
**Payload:**
```json
{
  "questionId": "q2",
  "transcription": "Um, I use Context API and Redux mostly.",
  "duration": 10
}
```
**Response Body:**
```json
{
  "success": false,
  "error": "Validation Error",
  "details": [
    {
      "field": "interviewId",
      "message": "Invalid Interview ID"
    }
  ]
}
```

## 7. Complete the interview
**Endpoint:** `POST /api/interview/complete`
**Payload:**
```json
{
  "interviewId": "mock_interview_456"
}
```
**Response Body:**
```json
{
  "success": true,
  "message": "Interview session completed",
  "data": {
    "_id": "mock_interview_456",
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
