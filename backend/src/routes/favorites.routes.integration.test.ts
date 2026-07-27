import { beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';

vi.mock('../config/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
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
import { signToken } from '../utils/jwt';
import app from '../app';

const mockedUserFindUnique = vi.mocked(prisma.user.findUnique);

const user = {
  id: 'user-1',
  email: 'test@example.com',
  name: 'Test User',
  avatar: null,
  createdAt: new Date('2026-01-01'),
};

const authHeader = () => ({ Authorization: `Bearer ${signToken({ userId: user.id })}` });

beforeEach(() => {
  vi.clearAllMocks();
  mockedUserFindUnique.mockResolvedValue(user as never);
});

describe('favorites routes require auth', () => {
  it('rejects an unauthenticated request', async () => {
    const res = await request(app).get('/api/favorites/teams');
    expect(res.status).toBe(401);
  });
});

describe('GET /api/favorites/teams', () => {
  it('returns the caller\'s favorite teams', async () => {
    const teams = [
      { id: 'fav-1', userId: user.id, teamId: 64, teamName: 'Liverpool FC', teamLogo: null, createdAt: new Date() },
    ];
    vi.mocked(prisma.favoriteTeam.findMany).mockResolvedValue(teams as never);

    const res = await request(app).get('/api/favorites/teams').set(authHeader());

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].teamName).toBe('Liverpool FC');
  });
});

describe('POST /api/favorites/teams', () => {
  it('rejects an invalid body (400) before hitting the database', async () => {
    const res = await request(app)
      .post('/api/favorites/teams')
      .set(authHeader())
      .send({ teamId: -1, teamName: '' });

    expect(res.status).toBe(400);
    expect(prisma.favoriteTeam.create).not.toHaveBeenCalled();
  });

  it('creates the favorite for a valid body', async () => {
    vi.mocked(prisma.favoriteTeam.findUnique).mockResolvedValue(null);
    const created = {
      id: 'fav-2',
      userId: user.id,
      teamId: 64,
      teamName: 'Liverpool FC',
      teamLogo: null,
      createdAt: new Date(),
    };
    vi.mocked(prisma.favoriteTeam.create).mockResolvedValue(created as never);

    const res = await request(app)
      .post('/api/favorites/teams')
      .set(authHeader())
      .send({ teamId: 64, teamName: 'Liverpool FC' });

    expect(res.status).toBe(201);
    expect(res.body.data.teamName).toBe('Liverpool FC');
  });
});

describe('DELETE /api/favorites/teams/:id', () => {
  it("404s when deleting someone else's favorite (and does not delete it)", async () => {
    vi.mocked(prisma.favoriteTeam.findUnique).mockResolvedValue({
      id: 'fav-1',
      userId: 'someone-else',
      teamId: 64,
      teamName: 'Liverpool FC',
      teamLogo: null,
      createdAt: new Date(),
    } as never);

    const res = await request(app)
      .delete('/api/favorites/teams/fav-1')
      .set(authHeader());

    expect(res.status).toBe(404);
    expect(prisma.favoriteTeam.delete).not.toHaveBeenCalled();
  });
});
