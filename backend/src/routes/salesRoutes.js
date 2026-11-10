import { Router } from 'express';
import { getSales, createSale } from '../controllers/salesController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { requireManagerOrOwner } from '../middleware/roleMiddleware.js';

const router = Router();

// Viewing full sales history requires Manager or Owner
router.get('/', authenticate, requireManagerOrOwner, getSales);

// Recording a sale can be done during cashiering
router.post('/', createSale);

export default router;

