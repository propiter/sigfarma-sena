import express from 'express';
import { ReportController } from './reports.controller.js';
import { authenticateToken } from '../../core/middleware/auth.js';

const router = express.Router();
const reportController = new ReportController();

router.use(authenticateToken);

router.get('/dashboard', reportController.getDashboardStats);
router.get('/sales', reportController.getSalesReport);
router.get('/inventory', reportController.getInventoryReport);
router.get('/expirations', reportController.getExpirationReport);

export { router as reportRoutes };