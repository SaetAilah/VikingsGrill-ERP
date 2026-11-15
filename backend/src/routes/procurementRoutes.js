import { Router } from 'express';
import { getOrders, createOrder, receiveOrder } from '../controllers/procurementController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { requireProcurementAccess } from '../middleware/roleMiddleware.js';

const router = Router();

router.use(authenticate);

// Viewing and managing purchase orders requires Accounting, Inventory, or Management
router.get('/orders', requireProcurementAccess, getOrders);
router.post('/orders', requireProcurementAccess, createOrder);
router.post('/orders/:orderNo/receive', requireProcurementAccess, receiveOrder);

export default router;

