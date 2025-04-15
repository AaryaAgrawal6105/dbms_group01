import express from 'express';
import { orderController } from '../controllers/orderController.js';

const router = express.Router();

// Get next order ID - must be placed before /:id to avoid conflict
router.get('/next-id', orderController.getNextOrderId);

// Standard CRUD routes
router.get('/', orderController.getAllOrders);
router.get('/:id', orderController.getOrderById);
router.post('/', orderController.addOrder);
router.put('/:id', orderController.updateOrder);
router.delete('/:id', orderController.deleteOrder);

export default router;