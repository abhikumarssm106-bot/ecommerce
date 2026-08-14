import { Router } from 'express';
import { getProducts, getProductBySlug, createProduct, updateProduct, deleteProduct } from '../controllers/productController';
import { authGuard, requireRole } from '../middleware/auth';

const router = Router();

router.get('/', getProducts);
router.get('/:slug', getProductBySlug);

// Admin-protected CRUD endpoints
router.post('/', authGuard, requireRole(['ADMIN', 'SUPER_ADMIN']), createProduct);
router.put('/:id', authGuard, requireRole(['ADMIN', 'SUPER_ADMIN']), updateProduct);
router.delete('/:id', authGuard, requireRole(['ADMIN', 'SUPER_ADMIN']), deleteProduct);

export default router;
