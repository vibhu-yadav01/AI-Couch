import { Router } from 'express';
import { getDashboard, getInterviewAnalytics } from '../controllers/analytics.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

router.get('/dashboard', protect, getDashboard);
router.get('/interview/:id', protect, getInterviewAnalytics);

export default router;
