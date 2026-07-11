import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { login, logout, me, register } from '../controllers/auth.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

// Throttle credential endpoints to slow brute-force attempts.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'محاولات كثيرة جداً، حاول مرة أخرى لاحقاً',
  },
});

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.get('/me', requireAuth, me);
router.post('/logout', requireAuth, logout);

export default router;
