import { Router } from 'express';
import { uploadResume, getResume, getUserResume } from '../controllers/resume.controller';
import { protect } from '../middleware/auth.middleware';
import { resumeUpload } from '../middleware/upload.middleware';

const router = Router();

router.post('/upload', protect, resumeUpload.single('resume'), uploadResume);
router.get('/me', protect, getUserResume);
router.get('/', protect, getUserResume);
router.get('/:id', protect, getResume);

export default router;

