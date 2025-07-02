import express from 'express';
import { ProviderController } from './providers.controller.js';
import { authenticateToken, authorizeRole } from '../../core/middleware/auth.js';

const router = express.Router();
const providerController = new ProviderController();

router.use(authenticateToken);

router.get('/', providerController.getProviders);
router.get('/stats', authorizeRole(['administrador', 'inventario']), providerController.getProviderStats);
router.get('/:id', providerController.getProvider);
router.post('/', authorizeRole(['administrador', 'inventario']), providerController.createProvider);
router.put('/:id', authorizeRole(['administrador', 'inventario']), providerController.updateProvider);
router.delete('/:id', authorizeRole(['administrador']), providerController.deleteProvider);

export { router as providerRoutes };