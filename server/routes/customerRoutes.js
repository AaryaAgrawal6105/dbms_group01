import express from 'express';
import { customerController } from '../controllers/customerController.js';

const router = express.Router();

// Get next customer ID - must be placed before /:id to avoid conflict
router.get('/next-id', customerController.getNextCustomerId);

// Standard CRUD routes
router.get('/', customerController.getAllCustomers);
router.get('/:id', customerController.getCustomerById);
router.post('/', customerController.addCustomer);
router.put('/:id', customerController.updateCustomer);
router.delete('/:id', customerController.deleteCustomer);

export default router;