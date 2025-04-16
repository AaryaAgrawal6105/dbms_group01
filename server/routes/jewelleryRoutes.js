import express from 'express';
import { jewelleryController } from '../controllers/jewelleryController.js';

const router = express.Router();

// Get next jewellery ID - must be placed before /:id to avoid conflict
router.get('/next-id', jewelleryController.getNextJewelleryId);

// Additional routes for jewellery functionality
router.get('/available/all', jewelleryController.getAvailableJewellery);
router.get('/stock/:id', jewelleryController.getJewelleryStock);

// Basic CRUD routes
router.get('/', jewelleryController.getAlljewellery);
router.get('/:id', jewelleryController.getjewelleryById);
router.post('/', jewelleryController.addjewellery);
router.put('/:id', jewelleryController.updatejewellery);
router.delete('/:id', jewelleryController.deletejewellery);

export default router;