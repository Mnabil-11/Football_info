import { RequestHandler } from 'express';
import {
  getCompetitions,
  getCompetitionMatches,
  getCompetitionTeams,
  getScorers,
  getStandings,
  getTeamMatches,
} from '../services/footballData.service';
import { ApiError } from '../utils/ApiError';

/** GET /api/football/competitions */
export const competitions: RequestHandler = async (_req, res, next) => {
  try {
    res.json({ success: true, data: await getCompetitions() });
  } catch (err) {
    next(err);
  }
};

/** GET /api/football/competitions/:code/standings */
export const standings: RequestHandler = async (req, res, next) => {
  try {
    res.json({ success: true, data: await getStandings(req.params.code) });
  } catch (err) {
    next(err);
  }
};

/** GET /api/football/competitions/:code/scorers */
export const scorers: RequestHandler = async (req, res, next) => {
  try {
    res.json({ success: true, data: await getScorers(req.params.code) });
  } catch (err) {
    next(err);
  }
};

/** GET /api/football/competitions/:code/teams */
export const competitionTeams: RequestHandler = async (req, res, next) => {
  try {
    res.json({ success: true, data: await getCompetitionTeams(req.params.code) });
  } catch (err) {
    next(err);
  }
};

/** GET /api/football/competitions/:code/matches?status=SCHEDULED|FINISHED */
export const competitionMatches: RequestHandler = async (req, res, next) => {
  try {
    const status =
      typeof req.query.status === 'string' ? req.query.status : undefined;
    res.json({
      success: true,
      data: await getCompetitionMatches(req.params.code, status),
    });
  } catch (err) {
    next(err);
  }
};

/** GET /api/football/teams/:id/matches?status=SCHEDULED|FINISHED */
export const teamMatches: RequestHandler = async (req, res, next) => {
  try {
    const teamId = Number(req.params.id);
    if (!Number.isInteger(teamId) || teamId <= 0) {
      throw ApiError.badRequest('معرّف الفريق غير صالح.');
    }
    const status =
      typeof req.query.status === 'string' ? req.query.status : undefined;
    res.json({ success: true, data: await getTeamMatches(teamId, status) });
  } catch (err) {
    next(err);
  }
};
