import { Router } from 'express';
import { getUsers, updateUserRole } from '../controllers/userController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { requireOwner } from '../middleware/roleMiddleware.js';

const router = Router();

router.use(authenticate, requireOwner);

router.get('/', getUsers);
router.put('/:id/role', updateUserRole);

export default router;

