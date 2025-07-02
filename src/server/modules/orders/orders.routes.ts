import express from 'express';
import { OrderController } from './orders.controller.js';
import { authenticateToken, authorizeRole } from '../../core/middleware/auth.js';

const router = express.Router();
const orderController = new OrderController();

router.use(authenticateToken);

router.get('/', orderController.getOrders);
router.get('/stats', authorizeRole(['administrador', 'inventario']), orderController.getOrderStats);
router.post('/', authorizeRole(['administrador', 'inventario']), orderController.createOrder);
router.post('/auto-generate', authorizeRole(['administrador', 'inventario']), orderController.generateAutoOrders);
router.get('/:id', orderController.getOrder);
router.put('/:id/status', authorizeRole(['administrador', 'inventario']), orderController.updateOrderStatus);
router.post('/:id/create-reception', authorizeRole(['administrador', 'inventario']), orderController.createReceptionFromOrder);

export { router as orderRoutes };