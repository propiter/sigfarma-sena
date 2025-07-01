import express from 'express';
import { InventoryController } from './inventory.controller.js';
import { authenticateToken, authorizeRole } from '../../core/middleware/auth.js';

const router = express.Router();
const inventoryController = new InventoryController();

router.use(authenticateToken);

router.post('/reception', authorizeRole(['administrador', 'inventario']), inventoryController.createReception);
router.get('/reception', inventoryController.getReceptions);
router.get('/reception/:id', inventoryController.getReception);
router.put('/reception/:id/complete', authorizeRole(['administrador', 'inventario']), inventoryController.completeReception);
router.get('/lotes/expiring', inventoryController.getExpiringLotes);
router.get('/products/low-stock', inventoryController.getLowStockProducts);

export { router as inventoryRoutes };