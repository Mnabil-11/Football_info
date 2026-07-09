import { RequestHandler } from 'express';
import { getMatchById } from '../services/footballData.service';
import {
  findFixtureByTeamsAndDate,
  getFixtureEvents,
  getFixtureLineups,
  getFixtureStatistics,
} from '../services/apiFootball.service';
import { ApiError } from '../utils/ApiError';

/**
 * GET /api/football/matches/:id
 *
 * Always returns the base match (football-data.org — reliable for the current
 * season). Additionally attempts best-effort enrichment from API-Football
 * (lineups/events/statistics) by fuzzy-matching on team names + date, since the
 * two providers have no shared ID space. `enrichment` is `null` when no
 * confident match is found, the upstream isn't subscribed, or the season isn't
 * covered — callers must treat that as "unavailable", not an error.
 */
export const getMatchDetails: RequestHandler = async (req, res, next) => {
  try {
    const matchId = Number(req.params.id);
    if (!Number.isInteger(matchId) || matchId <= 0) {
      throw ApiError.badRequest('معرّف المباراة غير صالح.');
    }

    const match = await getMatchById(matchId);

    const fixtureId = await findFixtureByTeamsAndDate(
      match.homeTeam.name,
      match.awayTeam.name,
      match.utcDate
    );

    let enrichment = null;
    if (fixtureId) {
      const [lineups, events, statistics] = await Promise.all([
        getFixtureLineups(fixtureId),
        getFixtureEvents(fixtureId),
        getFixtureStatistics(fixtureId),
      ]);
      const hasData =
        (lineups && lineups.length > 0) ||
        (events && events.length > 0) ||
        (statistics && statistics.length > 0);
      if (hasData) {
        enrichment = { lineups: lineups ?? [], events: events ?? [], statistics: statistics ?? [] };
      }
    }

    res.json({ success: true, data: { match, enrichment } });
  } catch (err) {
    next(err);
  }
};
