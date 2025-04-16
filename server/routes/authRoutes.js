import express from 'express';
import { authController } from '../controllers/authController.js';
import { authenticateToken, isAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes
router.post('/login', authController.login);

// Protected routes
router.get('/me', authenticateToken, authController.getCurrentUser);
router.post('/register', authenticateToken, isAdmin, authController.register);
router.get('/staff', authenticateToken, isAdmin, authController.getAllStaff);
router.get('/staff/:id', authenticateToken, authController.getStaffById);
router.put('/staff/:id', authenticateToken, authController.updateStaff);
router.put('/staff/:id/change-password', authenticateToken, authController.changePassword);
router.delete('/staff/:id', authenticateToken, isAdmin, authController.deleteStaff);

export default router;
