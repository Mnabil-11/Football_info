import { RequestHandler } from 'express';
import { z } from 'zod';
import {
  addFavoriteTeam,
  listFavoriteTeams,
  removeFavoriteTeam,
} from '../services/favorites.service';
import { ApiError } from '../utils/ApiError';

const addTeamSchema = z.object({
  teamId: z.number().int().positive('معرّف الفريق غير صالح'),
  teamName: z.string().min(1, 'اسم الفريق مطلوب'),
  teamLogo: z.string().url().nullable().optional(),
});

/** Guard: every favorites route is protected, so req.user must exist. */
const requireUserId = (userId: string | undefined): string => {
  if (!userId) {
    throw ApiError.unauthorized();
  }
  return userId;
};

/** GET /api/favorites/teams */
export const getFavoriteTeams: RequestHandler = async (req, res, next) => {
  try {
    const userId = requireUserId(req.user?.id);
    const teams = await listFavoriteTeams(userId);
    res.status(200).json({ success: true, data: teams });
  } catch (err) {
    next(err);
  }
};

/** POST /api/favorites/teams */
export const postFavoriteTeam: RequestHandler = async (req, res, next) => {
  try {
    const userId = requireUserId(req.user?.id);
    const data = addTeamSchema.parse(req.body);
    const created = await addFavoriteTeam(userId, data);
    res.status(201).json({ success: true, data: created });
  } catch (err) {
    next(err);
  }
};

/** DELETE /api/favorites/teams/:id */
export const deleteFavoriteTeam: RequestHandler = async (req, res, next) => {
  try {
    const userId = requireUserId(req.user?.id);
    await removeFavoriteTeam(userId, req.params.id);
    res.status(200).json({ success: true, message: 'تم الحذف من المفضلة' });
  } catch (err) {
    next(err);
  }
};
