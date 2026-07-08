import { Router } from 'express';
import {
  deleteFavoriteTeam,
  getFavoriteTeams,
  postFavoriteTeam,
} from '../controllers/favorites.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

// Every favorites route requires authentication.
router.use(requireAuth);

router.get('/teams', getFavoriteTeams);
router.post('/teams', postFavoriteTeam);
router.delete('/teams/:id', deleteFavoriteTeam);

export default router;
