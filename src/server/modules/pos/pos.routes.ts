import express from 'express';
import { POSController } from './pos.controller.js';
import { authenticateToken, authorizeRole } from '../../core/middleware/auth.js';

const router = express.Router();
const posController = new POSController();

router.use(authenticateToken);

router.post('/sales', authorizeRole(['administrador', 'cajero']), posController.createSale);
router.get('/sales', posController.getSales);
router.get('/sales/:id', posController.getSale);
router.post('/sales/:id/cancel', authorizeRole(['administrador']), posController.cancelSale);

export { router as posRoutes };