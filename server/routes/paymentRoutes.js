import express from 'express';
import { paymentController } from '../controllers/paymentController.js';

const router = express.Router();

// Get next payment ID - must be placed before /:id to avoid conflict
router.get('/next-id', paymentController.getNextPaymentId);

// Standard CRUD routes
router.get('/', paymentController.getAllpayment);
router.get('/:id', paymentController.getPaymentById);
router.post('/', paymentController.addPayment);
router.put('/:id', paymentController.updatePayment);
router.delete('/:id', paymentController.deletePayment);

export default router;