import express from 'express';
import { InventoryController } from './inventory.controller.js';
import { authenticateToken, authorizeRole } from '../../core/middleware/auth.js';

const router = express.Router();
const inventoryController = new InventoryController();

router.use(authenticateToken);

// Reception management
router.post('/reception', authorizeRole(['administrador', 'inventario']), inventoryController.createReception);
router.get('/reception', inventoryController.getReceptions);
router.get('/reception/pending-approvals', authorizeRole(['administrador']), inventoryController.getPendingApprovals);
router.get('/reception/:id', inventoryController.getReception);
router.put('/reception/:id/approve', authorizeRole(['administrador']), inventoryController.approveReception);
router.put('/reception/:id/reject', authorizeRole(['administrador']), inventoryController.rejectReception);
router.get('/reception/:id/export-pdf', inventoryController.exportReceptionPDF);

// Bajas de inventario
router.post('/bajas', authorizeRole(['administrador', 'inventario']), inventoryController.createBaja);
router.get('/bajas', inventoryController.getBajas);
router.get('/bajas/pending', authorizeRole(['administrador']), inventoryController.getPendingBajas);
router.get('/bajas/:id', inventoryController.getBaja);
router.put('/bajas/:id/approve', authorizeRole(['administrador']), inventoryController.approveBaja);
router.put('/bajas/:id/reject', authorizeRole(['administrador']), inventoryController.rejectBaja);

// Inventory reports
router.get('/lotes/expiring', inventoryController.getExpiringLotes);
router.get('/products/low-stock', inventoryController.getLowStockProducts);

export { router as inventoryRoutes };