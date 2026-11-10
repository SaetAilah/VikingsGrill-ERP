import { Router } from 'express';
import { getOrders, createOrder, receiveOrder } from '../controllers/procurementController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { requireManagerOrOwner } from '../middleware/roleMiddleware.js';

const router = Router();

router.use(authenticate, requireManagerOrOwner);

router.get('/orders', getOrders);
router.post('/orders', createOrder);
router.post('/orders/:orderNo/receive', receiveOrder);

export default router;

