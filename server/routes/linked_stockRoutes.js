import express from 'express';
import { linked_stockController } from '../controllers/linked_stockController.js';

const router = express.Router();

// Get all linked stock items
router.get('/', linked_stockController.getAlllinked_stock);

// Get linked stock by jewellery ID
router.get('/jewellery/:id', linked_stockController.getlinked_stockByJewelleryId);

// Get linked stock by composite key
router.get('/:jewellery_id/:model_no/:unit_id', linked_stockController.getlinked_stockByCompositeKey);

// Add new linked stock
router.post('/', linked_stockController.addlinked_stock);

// Update linked stock
router.put('/:jewellery_id/:model_no/:unit_id', linked_stockController.updatelinked_stock);

// Delete linked stock
router.delete('/:jewellery_id/:model_no/:unit_id', linked_stockController.deletelinked_stock);

// Update linked stock status
router.patch('/status/:jewellery_id/:model_no/:unit_id', linked_stockController.updateLinkedStockStatus);

// Get available stock
router.get('/available/all', linked_stockController.getAvailableStock);

export default router;