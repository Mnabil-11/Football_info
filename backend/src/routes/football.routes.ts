import { Router } from 'express';
import {
  competitionMatches,
  competitions,
  competitionTeams,
  scorers,
  standings,
  teamMatches,
} from '../controllers/football.controller';

// Public read-only proxy for football-data.org (no auth required).
const router = Router();

router.get('/competitions', competitions);
router.get('/competitions/:code/standings', standings);
router.get('/competitions/:code/scorers', scorers);
router.get('/competitions/:code/teams', competitionTeams);
router.get('/competitions/:code/matches', competitionMatches);
router.get('/teams/:id/matches', teamMatches);

export default router;
