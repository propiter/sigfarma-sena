import express from 'express';
import { AuthController } from './auth.controller.js';

const router = express.Router();
const authController = new AuthController();

router.post('/login', authController.login);
router.post('/logout', authController.logout);
router.get('/me', authController.me);

export { router as authRoutes };