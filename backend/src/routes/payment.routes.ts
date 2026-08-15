import { Router } from 'express';
import { verifyPayment } from '../controllers/paymentController';
import { authGuard } from '../middleware/auth';

const router = Router();

router.post('/verify', authGuard, verifyPayment);

export default router;
