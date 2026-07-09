import { RequestHandler } from 'express';
import { getPersonById } from '../services/footballData.service';
import {
  findPlayerByNameAndTeam,
  getPlayerByAfId,
} from '../services/apiFootball.service';
import { ApiError } from '../utils/ApiError';

const parseId = (raw: string): number => {
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) {
    throw ApiError.badRequest('معرّف اللاعب غير صالح.');
  }
  return id;
};

/**
 * GET /api/football/players/fd/:id
 * Bio from football-data.org (reliable) + best-effort API-Football stats
 * enrichment by name+team match. `statsEnrichment` is `null` when not found.
 */
export const getPlayerFd: RequestHandler = async (req, res, next) => {
  try {
    const id = parseId(req.params.id);
    const profile = await getPersonById(id);

    const statsEnrichment = profile.currentTeam
      ? await findPlayerByNameAndTeam(profile.name, profile.currentTeam.name)
      : null;

    res.json({ success: true, data: { profile, statsEnrichment } });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/football/players/af/:id?season=YYYY
 * Direct API-Football profile + season stats (exact id, no fuzzy matching).
 */
export const getPlayerAf: RequestHandler = async (req, res, next) => {
  try {
    const id = parseId(req.params.id);
    const season =
      typeof req.query.season === 'string' ? Number(req.query.season) : undefined;

    const entry = await getPlayerByAfId(id, season);
    if (!entry) {
      throw ApiError.notFound(
        'لا تتوفر بيانات لهذا اللاعب (قد يكون خارج نطاق الخطة المجانية).'
      );
    }

    res.json({ success: true, data: { profile: entry } });
  } catch (err) {
    next(err);
  }
};
