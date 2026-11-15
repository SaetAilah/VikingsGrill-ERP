import { Router } from 'express';
import { getSuppliers, createSupplier } from '../controllers/supplierController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { requireProcurementAccess } from '../middleware/roleMiddleware.js';

const router = Router();

router.use(authenticate);

// Viewing and managing suppliers requires Accounting, Inventory, or Management
router.get('/', requireProcurementAccess, getSuppliers);
router.post('/', requireProcurementAccess, createSupplier);

export default router;

