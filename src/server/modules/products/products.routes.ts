import express from 'express';
import { ProductController } from './products.controller.js';
import { authenticateToken, authorizeRole } from '../../core/middleware/auth.js';

const router = express.Router();
const productController = new ProductController();

router.use(authenticateToken);

router.get('/', productController.getProducts);
router.get('/:id', productController.getProduct);
router.post('/', authorizeRole(['administrador', 'inventario']), productController.createProduct);
router.put('/:id', authorizeRole(['administrador', 'inventario']), productController.updateProduct);
router.delete('/:id', authorizeRole(['administrador']), productController.deleteProduct);
router.get('/search/:query', productController.searchProducts);
router.get('/:id/lotes', productController.getProductLotes);

export { router as productRoutes };