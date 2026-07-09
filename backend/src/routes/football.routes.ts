import { Router } from 'express';
import {
  competitionMatches,
  competitions,
  competitionTeams,
  scorers,
  standings,
  teamMatches,
} from '../controllers/football.controller';
import { getMatchDetails } from '../controllers/matchDetails.controller';
import { getPlayerAf, getPlayerFd } from '../controllers/player.controller';

// Public read-only proxy for football-data.org + API-Football (no auth required).
const router = Router();

router.get('/competitions', competitions);
router.get('/competitions/:code/standings', standings);
router.get('/competitions/:code/scorers', scorers);
router.get('/competitions/:code/teams', competitionTeams);
router.get('/competitions/:code/matches', competitionMatches);
router.get('/teams/:id/matches', teamMatches);
router.get('/matches/:id', getMatchDetails);
router.get('/players/fd/:id', getPlayerFd);
router.get('/players/af/:id', getPlayerAf);

export default router;
