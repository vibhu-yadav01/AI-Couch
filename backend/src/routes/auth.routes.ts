import { Router } from 'express';
import { register, login, getProfile, updateProfile } from '../controllers/auth.controller';
import { protect } from '../middleware/auth.middleware';
import { validate, registerRules, loginRules, updateProfileRules } from '../middleware/validation.middleware';

const router = Router();

router.post('/register', validate(registerRules), register);
router.post('/login', validate(loginRules), login);
router.get('/profile', protect, getProfile);
router.put('/profile', protect, validate(updateProfileRules), updateProfile);

export default router;
