import { beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';

vi.mock('../config/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}));

import { prisma } from '../config/prisma';
import { hashPassword } from '../utils/password';
import { signToken } from '../utils/jwt';
import app from '../app';

const mockedFindUnique = vi.mocked(prisma.user.findUnique);
const mockedCreate = vi.mocked(prisma.user.create);

const safeUser = {
  id: 'user-1',
  email: 'test@example.com',
  name: 'Test User',
  avatar: null,
  createdAt: new Date('2026-01-01').toISOString(),
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('POST /api/auth/register', () => {
  it('creates the user and sets the session cookie', async () => {
    mockedFindUnique.mockResolvedValue(null);
    mockedCreate.mockResolvedValue({
      ...safeUser,
      createdAt: new Date(safeUser.createdAt),
    } as never);

    const res = await request(app).post('/api/auth/register').send({
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User',
    });

    expect(res.status).toBe(201);
    expect(res.body.data.user.email).toBe('test@example.com');
    expect(res.body.data.user).not.toHaveProperty('password');
    expect(res.headers['set-cookie']?.[0]).toMatch(/^ft_token=/);
  });

  it('rejects an invalid email with 400 before touching the database', async () => {
    const res = await request(app).post('/api/auth/register').send({
      email: 'not-an-email',
      password: 'password123',
      name: 'Test User',
    });

    expect(res.status).toBe(400);
    expect(mockedCreate).not.toHaveBeenCalled();
  });

  it('returns 409 for a duplicate email', async () => {
    mockedFindUnique.mockResolvedValue({
      ...safeUser,
      createdAt: new Date(safeUser.createdAt),
    } as never);

    const res = await request(app).post('/api/auth/register').send({
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User',
    });

    expect(res.status).toBe(409);
  });
});

describe('POST /api/auth/login', () => {
  it('returns 401 for wrong credentials without leaking whether the email exists', async () => {
    mockedFindUnique.mockResolvedValue(null);

    const res = await request(app).post('/api/auth/login').send({
      email: 'nobody@example.com',
      password: 'password123',
    });

    expect(res.status).toBe(401);
  });

  it('logs in with correct credentials and sets the cookie', async () => {
    const password = await hashPassword('password123');
    mockedFindUnique.mockResolvedValue({
      ...safeUser,
      createdAt: new Date(safeUser.createdAt),
      password,
    } as never);

    const res = await request(app).post('/api/auth/login').send({
      email: 'test@example.com',
      password: 'password123',
    });

    expect(res.status).toBe(200);
    expect(res.headers['set-cookie']?.[0]).toMatch(/^ft_token=/);
  });
});

describe('GET /api/auth/me', () => {
  it('rejects requests with no token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('rejects an invalid token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer not-a-real-token');
    expect(res.status).toBe(401);
  });

  it('returns the user for a valid Bearer token', async () => {
    const token = signToken({ userId: safeUser.id });
    mockedFindUnique.mockResolvedValue({
      ...safeUser,
      createdAt: new Date(safeUser.createdAt),
    } as never);

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.user.email).toBe(safeUser.email);
  });
});

describe('POST /api/auth/logout', () => {
  it('requires auth', async () => {
    const res = await request(app).post('/api/auth/logout');
    expect(res.status).toBe(401);
  });

  it('clears the session cookie when authenticated', async () => {
    const token = signToken({ userId: safeUser.id });
    mockedFindUnique.mockResolvedValue({
      ...safeUser,
      createdAt: new Date(safeUser.createdAt),
    } as never);

    const res = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    // clearCookie sends an expired cookie rather than omitting the header.
    expect(res.headers['set-cookie']?.[0]).toMatch(/^ft_token=;/);
  });
});
