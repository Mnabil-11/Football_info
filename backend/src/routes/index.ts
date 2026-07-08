import { Router } from 'express';
import authRoutes from './auth.routes';
import favoritesRoutes from './favorites.routes';
import footballRoutes from './football.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/favorites', favoritesRoutes);
router.use('/football', footballRoutes);

export default router;
