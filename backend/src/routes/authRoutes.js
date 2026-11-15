import { Router } from 'express';
import { register, login, me, logout, getSsoToken } from '../controllers/authController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', authenticate, me);
router.get('/sso-token', authenticate, getSsoToken);
router.post('/logout', authenticate, logout);

export default router;

