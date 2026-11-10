import { Router } from 'express';
import { getSuppliers, createSupplier } from '../controllers/supplierController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { requireManagerOrOwner } from '../middleware/roleMiddleware.js';

const router = Router();

router.use(authenticate, requireManagerOrOwner);

router.get('/', getSuppliers);
router.post('/', createSupplier);

export default router;

