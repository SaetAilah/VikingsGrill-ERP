import { Router } from 'express';
import {
  getItems,
  createItem,
  updateItem,
  recordAdjustment,
  getMovements,
} from '../controllers/inventoryController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { requireManagerOrOwner } from '../middleware/roleMiddleware.js';

const router = Router();

router.get('/items', getItems);
router.post('/items', authenticate, requireManagerOrOwner, createItem);
router.put('/items/:id', authenticate, requireManagerOrOwner, updateItem);
router.post('/items/:id/adjustments', recordAdjustment);
router.get('/movements', getMovements);

export default router;

