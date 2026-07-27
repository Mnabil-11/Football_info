import { RequestHandler } from 'express';
import {
  getCompetitions,
  getCompetitionMatches,
  getCompetitionTeams,
  getScorers,
  getStandings,
  getTeamById,
  getTeamMatches,
} from '../services/footballData.service';
import { ApiError } from '../utils/ApiError';

const parseTeamId = (raw: string): number => {
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) {
    throw ApiError.badRequest('معرّف الفريق غير صالح.');
  }
  return id;
};

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

/** GET /api/football/teams/:id — crest, venue, coach, squad. */
export const teamDetail: RequestHandler = async (req, res, next) => {
  try {
    const teamId = parseTeamId(req.params.id);
    res.json({ success: true, data: await getTeamById(teamId) });
  } catch (err) {
    next(err);
  }
};

/** GET /api/football/teams/:id/matches?status=SCHEDULED|FINISHED */
export const teamMatches: RequestHandler = async (req, res, next) => {
  try {
    const teamId = parseTeamId(req.params.id);
    const status =
      typeof req.query.status === 'string' ? req.query.status : undefined;
    res.json({ success: true, data: await getTeamMatches(teamId, status) });
  } catch (err) {
    next(err);
  }
};
