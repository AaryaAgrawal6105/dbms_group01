import express from 'express';
import { reportController } from '../controllers/reportController.js';
import { authenticateToken, isAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes (no authentication required)
router.get('/sales-by-date', reportController.getSalesByDate);
router.get('/available-jewellery', reportController.getAvailablejewellery);

// Protected routes (authentication required)
router.get('/dashboard', authenticateToken, reportController.getDashboardData);

export default router;