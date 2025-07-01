import express from 'express';
import { UserController } from './users.controller.js';
import { authenticateToken, authorizeRole } from '../../core/middleware/auth.js';

const router = express.Router();
const userController = new UserController();

router.use(authenticateToken);

router.get('/', authorizeRole(['administrador']), userController.getUsers);
router.get('/stats', authorizeRole(['administrador']), userController.getUserStats);
router.get('/:id/activity', authorizeRole(['administrador']), userController.getUserActivity);
router.post('/', authorizeRole(['administrador']), userController.createUser);
router.put('/:id', authorizeRole(['administrador']), userController.updateUser);
router.delete('/:id', authorizeRole(['administrador']), userController.deleteUser);

export { router as userRoutes };