import { Router } from 'express';
import { getSales, createSale } from '../controllers/salesController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { requireAccountingOrManagement } from '../middleware/roleMiddleware.js';

const router = Router();

// Viewing sales history & reconciliation requires Accounting, Manager, or Owner
router.get('/', authenticate, requireAccountingOrManagement, getSales);

// Recording a sale can be done during cashiering
router.post('/', createSale);

export default router;

