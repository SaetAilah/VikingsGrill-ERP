import { Router } from 'express';
import { getSuppliers, createSupplier } from '../controllers/supplierController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { requireAccountingOrManagement, requireManagerOrOwner } from '../middleware/roleMiddleware.js';

const router = Router();

router.use(authenticate);

// Viewing suppliers requires Accounting or Management
router.get('/', requireAccountingOrManagement, getSuppliers);
router.post('/', requireManagerOrOwner, createSupplier);

export default router;

