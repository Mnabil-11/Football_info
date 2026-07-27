import { Router } from 'express';
import {
  competitionMatches,
  competitions,
  competitionTeams,
  scorers,
  standings,
  teamDetail,
  teamMatches,
} from '../controllers/football.controller';
import { getMatchDetails } from '../controllers/matchDetails.controller';
import { getPlayerAf, getPlayerFd } from '../controllers/player.controller';
import { cacheControl } from '../middleware/cacheControl';

// Public read-only proxy for football-data.org + API-Football (no auth required).
// max-age below mirrors each route's server-side TtlCache TTL (see
// footballData.service.ts / apiFootball.service.ts) — no point telling the
// browser to cache longer than the data we're serving is actually fresh for.
const router = Router();

router.get('/competitions', cacheControl(600), competitions);
router.get('/competitions/:code/standings', cacheControl(300), standings);
router.get('/competitions/:code/scorers', cacheControl(300), scorers);
router.get('/competitions/:code/teams', cacheControl(600), competitionTeams);
router.get('/competitions/:code/matches', cacheControl(120), competitionMatches);
router.get('/teams/:id', cacheControl(3600), teamDetail);
router.get('/teams/:id/matches', cacheControl(120), teamMatches);
router.get('/matches/:id', cacheControl(60), getMatchDetails);
router.get('/players/fd/:id', cacheControl(300), getPlayerFd);
router.get('/players/af/:id', cacheControl(300), getPlayerAf);

export default router;
