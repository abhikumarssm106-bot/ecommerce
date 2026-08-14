import { Router } from 'express';
import { createReview, deleteReview, moderateReview } from '../controllers/reviewController';
import { authGuard, requireRole } from '../middleware/auth';

const router = Router();

router.use(authGuard);

router.post('/', createReview);
router.delete('/:id', deleteReview);

// Admin-only review moderation endpoint
router.put('/:id/moderate', requireRole(['ADMIN', 'SUPER_ADMIN']), moderateReview);

export default router;
