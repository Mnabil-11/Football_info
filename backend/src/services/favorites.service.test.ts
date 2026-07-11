import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../config/prisma', () => ({
  prisma: {
    favoriteTeam: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
    favoritePlayer: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

import { prisma } from '../config/prisma';
import {
  addFavoritePlayer,
  addFavoriteTeam,
  removeFavoritePlayer,
  removeFavoriteTeam,
} from './favorites.service';

const teamFavorite = {
  id: 'fav-1',
  userId: 'user-1',
  teamId: 64,
  teamName: 'Liverpool FC',
  teamLogo: null,
  createdAt: new Date('2026-01-01'),
};

const playerFavorite = {
  id: 'pfav-1',
  userId: 'user-1',
  playerId: 3754,
  playerName: 'Mohamed Salah',
  playerPhoto: null,
  createdAt: new Date('2026-01-01'),
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('addFavoriteTeam', () => {
  it('creates the favorite when it does not exist yet', async () => {
    vi.mocked(prisma.favoriteTeam.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.favoriteTeam.create).mockResolvedValue(teamFavorite);

    const result = await addFavoriteTeam('user-1', {
      teamId: 64,
      teamName: 'Liverpool FC',
    });

    expect(result).toEqual(teamFavorite);
    expect(prisma.favoriteTeam.create).toHaveBeenCalledWith({
      data: {
        userId: 'user-1',
        teamId: 64,
        teamName: 'Liverpool FC',
        teamLogo: null,
      },
    });
  });

  it('rejects duplicates with 409', async () => {
    vi.mocked(prisma.favoriteTeam.findUnique).mockResolvedValue(teamFavorite);

    await expect(
      addFavoriteTeam('user-1', { teamId: 64, teamName: 'Liverpool FC' })
    ).rejects.toMatchObject({ statusCode: 409 });
    expect(prisma.favoriteTeam.create).not.toHaveBeenCalled();
  });
});

describe('removeFavoriteTeam', () => {
  it('deletes a favorite owned by the caller', async () => {
    vi.mocked(prisma.favoriteTeam.findUnique).mockResolvedValue(teamFavorite);
    vi.mocked(prisma.favoriteTeam.delete).mockResolvedValue(teamFavorite);

    await removeFavoriteTeam('user-1', 'fav-1');

    expect(prisma.favoriteTeam.delete).toHaveBeenCalledWith({
      where: { id: 'fav-1' },
    });
  });

  it("refuses to delete another user's favorite (404, not deleted)", async () => {
    vi.mocked(prisma.favoriteTeam.findUnique).mockResolvedValue(teamFavorite);

    await expect(
      removeFavoriteTeam('someone-else', 'fav-1')
    ).rejects.toMatchObject({ statusCode: 404 });
    expect(prisma.favoriteTeam.delete).not.toHaveBeenCalled();
  });

  it('404s when the favorite does not exist', async () => {
    vi.mocked(prisma.favoriteTeam.findUnique).mockResolvedValue(null);

    await expect(removeFavoriteTeam('user-1', 'missing')).rejects.toMatchObject(
      { statusCode: 404 }
    );
  });
});

describe('addFavoritePlayer', () => {
  it('creates the favorite when it does not exist yet', async () => {
    vi.mocked(prisma.favoritePlayer.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.favoritePlayer.create).mockResolvedValue(playerFavorite);

    const result = await addFavoritePlayer('user-1', {
      playerId: 3754,
      playerName: 'Mohamed Salah',
    });

    expect(result).toEqual(playerFavorite);
  });

  it('rejects duplicates with 409', async () => {
    vi.mocked(prisma.favoritePlayer.findUnique).mockResolvedValue(
      playerFavorite
    );

    await expect(
      addFavoritePlayer('user-1', { playerId: 3754, playerName: 'Mohamed Salah' })
    ).rejects.toMatchObject({ statusCode: 409 });
  });
});

describe('removeFavoritePlayer', () => {
  it("refuses to delete another user's favorite (404, not deleted)", async () => {
    vi.mocked(prisma.favoritePlayer.findUnique).mockResolvedValue(
      playerFavorite
    );

    await expect(
      removeFavoritePlayer('someone-else', 'pfav-1')
    ).rejects.toMatchObject({ statusCode: 404 });
    expect(prisma.favoritePlayer.delete).not.toHaveBeenCalled();
  });
});
