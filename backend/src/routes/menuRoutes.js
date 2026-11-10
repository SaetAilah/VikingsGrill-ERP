import { Router } from 'express';
import { getMenu, createMenuItem, updateMenuItem, deleteMenuItem } from '../controllers/menuController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { requireStaffOrAbove } from '../middleware/roleMiddleware.js';

const router = Router();

router.get('/', getMenu);

// Mutating menu items requires staff or above
router.post('/', authenticate, requireStaffOrAbove, createMenuItem);
router.put('/:id', authenticate, requireStaffOrAbove, updateMenuItem);
router.delete('/:id', authenticate, requireStaffOrAbove, deleteMenuItem);

export default router;

