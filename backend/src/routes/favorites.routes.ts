import { Router } from 'express';
import {
  deleteFavoritePlayer,
  deleteFavoriteTeam,
  getFavoritePlayers,
  getFavoriteTeams,
  postFavoritePlayer,
  postFavoriteTeam,
} from '../controllers/favorites.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

// Every favorites route requires authentication.
router.use(requireAuth);

router.get('/teams', getFavoriteTeams);
router.post('/teams', postFavoriteTeam);
router.delete('/teams/:id', deleteFavoriteTeam);

router.get('/players', getFavoritePlayers);
router.post('/players', postFavoritePlayer);
router.delete('/players/:id', deleteFavoritePlayer);

export default router;
