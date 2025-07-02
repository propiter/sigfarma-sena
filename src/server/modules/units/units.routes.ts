import express from 'express';
import { UnitsController } from './units.controller.js';
import { authenticateToken, authorizeRole } from '../../core/middleware/auth.js';

const router = express.Router();
const unitsController = new UnitsController();

router.use(authenticateToken);

router.get('/', unitsController.getUnits);
router.post('/', authorizeRole(['administrador', 'inventario']), unitsController.createUnit);

export { router as unitsRoutes };