import express from 'express';
import { SettingsController } from './settings.controller.js';
import { authenticateToken, authorizeRole } from '../../core/middleware/auth.js';

const router = express.Router();
const settingsController = new SettingsController();

router.use(authenticateToken);

router.get('/', settingsController.getSettings);
router.put('/', authorizeRole(['administrador']), settingsController.updateSettings);

export { router as settingsRoutes };