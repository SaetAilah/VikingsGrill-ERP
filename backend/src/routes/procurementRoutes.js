import { Router } from 'express';
import { getOrders, createOrder, receiveOrder } from '../controllers/procurementController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { requireAccountingOrManagement, requireManagerOrOwner } from '../middleware/roleMiddleware.js';

const router = Router();

router.use(authenticate);

// Viewing orders requires Accounting or Management
router.get('/orders', requireAccountingOrManagement, getOrders);
router.post('/orders', requireManagerOrOwner, createOrder);
router.post('/orders/:orderNo/receive', requireManagerOrOwner, receiveOrder);

export default router;

