import { Router } from 'express';
import { getTables, updateTableStatus } from '../controllers/tableController.js';

const router = Router();

router.get('/', getTables);
router.patch('/:id/status', updateTableStatus);

export default router;
