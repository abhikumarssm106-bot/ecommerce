import { Router } from 'express';
import { register, login, refresh, logout, getProfile, addAddress } from '../controllers/authController';
import { authGuard } from '../middleware/auth';
import { validate } from '../middleware/validator';
import { registerSchema, loginSchema } from '../validators/auth';

const router = Router();

router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.post('/refresh-token', refresh);
router.post('/logout', logout);
router.get('/profile', authGuard, getProfile);
router.post('/profile/addresses', authGuard, addAddress);

export default router;
