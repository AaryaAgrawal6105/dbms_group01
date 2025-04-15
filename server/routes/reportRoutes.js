import express from 'express';
import { reportController } from '../controllers/reportController.js';

const router = express.Router();

router.get('/sales-by-date', reportController.getSalesByDate);
router.get('/available-jewellery', reportController.getAvailablejewellery);

export default router;