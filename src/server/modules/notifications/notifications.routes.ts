import express from 'express';
import { NotificationController } from './notifications.controller.js';
import { authenticateToken, authorizeRole } from '../../core/middleware/auth.js';

const router = express.Router();
const notificationController = new NotificationController();

router.use(authenticateToken);

router.get('/', notificationController.getNotifications);
router.get('/count', notificationController.getNotificationCount);
router.put('/:id/read', notificationController.markAsRead);
router.put('/read-all', notificationController.markAllAsRead);
router.delete('/:id', notificationController.dismissNotification);
router.post('/', authorizeRole(['administrador', 'inventario']), notificationController.createNotification);

export { router as notificationRoutes };