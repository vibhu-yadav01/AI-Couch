import { Router } from 'express';
import {
  startInterview,
  submitTextAnswer,
  submitVoiceAnswer,
  getInterviewHistory,
  getInterview,
  submitAnswer,
  completeInterview,
} from '../controllers/interview.controller';
import { protect } from '../middleware/auth.middleware';
import { audioUpload } from '../middleware/upload.middleware';
import { validate, startInterviewRules, submitTextAnswerRules, submitVoiceAnswerRules } from '../middleware/validation.middleware';

const router = Router();

router.post('/start', protect, validate(startInterviewRules), startInterview);
router.post('/answer', protect, audioUpload.single('audio'), submitAnswer);
router.post('/complete', protect, completeInterview);
router.post('/:interviewId/answer/text', protect, validate(submitTextAnswerRules), submitTextAnswer);
router.post('/:interviewId/answer/voice', protect, audioUpload.single('audio'), validate(submitVoiceAnswerRules), submitVoiceAnswer);
router.get('/history', protect, getInterviewHistory);
router.get('/:id', protect, getInterview);

export default router;

