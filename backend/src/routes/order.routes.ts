import { Router } from 'express';
import { createOrder, getMyOrders, getOrderDetails, cancelOrder, updateOrderStatus } from '../controllers/orderController';
import { authGuard, requireRole } from '../middleware/auth';

const router = Router();

// All order routes require active login
router.use(authGuard);

router.post('/checkout', createOrder);
router.get('/', getMyOrders);
router.get('/:id', getOrderDetails);
router.post('/:id/cancel', cancelOrder);

// Admin status update endpoints
router.put('/:id/status', requireRole(['ADMIN', 'SUPER_ADMIN']), updateOrderStatus);

export default router;
