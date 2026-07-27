import { Router } from 'express';
import rateLimit from 'express-rate-limit';
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
import { validateParams, validateQuery } from '../middleware/validate';
import { competitionCodeParams, matchStatusQuery } from '../schemas/football.schemas';

// Public read-only proxy for football-data.org + API-Football (no auth required).
// max-age below mirrors each route's server-side TtlCache TTL (see
// footballData.service.ts / apiFootball.service.ts) — no point telling the
// browser to cache longer than the data we're serving is actually fresh for.
const router = Router();

// Our own TtlCache already shields football-data.org's tighter free-tier
// limit; this guards our own server against being hammered directly. Limit
// is generous enough for a real session (including 30s live-match polling).
const footballLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'تم تجاوز حد الطلبات المسموح. حاول بعد قليل.',
  },
});
router.use(footballLimiter);

router.get('/competitions', cacheControl(600), competitions);
router.get(
  '/competitions/:code/standings',
  validateParams(competitionCodeParams),
  cacheControl(300),
  standings
);
router.get(
  '/competitions/:code/scorers',
  validateParams(competitionCodeParams),
  cacheControl(300),
  scorers
);
router.get(
  '/competitions/:code/teams',
  validateParams(competitionCodeParams),
  cacheControl(600),
  competitionTeams
);
router.get(
  '/competitions/:code/matches',
  validateParams(competitionCodeParams),
  validateQuery(matchStatusQuery),
  cacheControl(120),
  competitionMatches
);
router.get('/teams/:id', cacheControl(3600), teamDetail);
router.get(
  '/teams/:id/matches',
  validateQuery(matchStatusQuery),
  cacheControl(120),
  teamMatches
);
router.get('/matches/:id', cacheControl(60), getMatchDetails);
router.get('/players/fd/:id', cacheControl(300), getPlayerFd);
router.get('/players/af/:id', cacheControl(300), getPlayerAf);

export default router;
