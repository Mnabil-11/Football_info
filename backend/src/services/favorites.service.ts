import { FavoritePlayer, FavoriteTeam } from '@prisma/client';
import { prisma } from '../config/prisma';
import { ApiError } from '../utils/ApiError';

export interface AddFavoriteTeamInput {
  teamId: number;
  teamName: string;
  teamLogo?: string | null;
}

export interface AddFavoritePlayerInput {
  playerId: number;
  playerName: string;
  playerPhoto?: string | null;
}

/** List a user's favorite teams (newest first). */
export const listFavoriteTeams = (userId: string): Promise<FavoriteTeam[]> =>
  prisma.favoriteTeam.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });

/** Add a favorite team. Idempotent-ish: duplicates are rejected with 409. */
export const addFavoriteTeam = async (
  userId: string,
  input: AddFavoriteTeamInput
): Promise<FavoriteTeam> => {
  const existing = await prisma.favoriteTeam.findUnique({
    where: { userId_teamId: { userId, teamId: input.teamId } },
  });
  if (existing) {
    throw ApiError.conflict('الفريق موجود في المفضلة بالفعل');
  }

  return prisma.favoriteTeam.create({
    data: {
      userId,
      teamId: input.teamId,
      teamName: input.teamName,
      teamLogo: input.teamLogo ?? null,
    },
  });
};

/**
 * Remove a favorite team by its record id, scoped to the owner so a user can
 * never delete someone else's favorite.
 */
export const removeFavoriteTeam = async (
  userId: string,
  favoriteId: string
): Promise<void> => {
  const favorite = await prisma.favoriteTeam.findUnique({
    where: { id: favoriteId },
  });

  if (!favorite || favorite.userId !== userId) {
    throw ApiError.notFound('الفريق غير موجود في المفضلة');
  }

  await prisma.favoriteTeam.delete({ where: { id: favoriteId } });
};

/** List a user's favorite players (newest first). */
export const listFavoritePlayers = (userId: string): Promise<FavoritePlayer[]> =>
  prisma.favoritePlayer.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });

/** Add a favorite player. Idempotent-ish: duplicates are rejected with 409. */
export const addFavoritePlayer = async (
  userId: string,
  input: AddFavoritePlayerInput
): Promise<FavoritePlayer> => {
  const existing = await prisma.favoritePlayer.findUnique({
    where: { userId_playerId: { userId, playerId: input.playerId } },
  });
  if (existing) {
    throw ApiError.conflict('اللاعب موجود في المفضلة بالفعل');
  }

  return prisma.favoritePlayer.create({
    data: {
      userId,
      playerId: input.playerId,
      playerName: input.playerName,
      playerPhoto: input.playerPhoto ?? null,
    },
  });
};

/**
 * Remove a favorite player by its record id, scoped to the owner so a user can
 * never delete someone else's favorite.
 */
export const removeFavoritePlayer = async (
  userId: string,
  favoriteId: string
): Promise<void> => {
  const favorite = await prisma.favoritePlayer.findUnique({
    where: { id: favoriteId },
  });

  if (!favorite || favorite.userId !== userId) {
    throw ApiError.notFound('اللاعب غير موجود في المفضلة');
  }

  await prisma.favoritePlayer.delete({ where: { id: favoriteId } });
};
