import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '../utils/ApiError';
import { hashPassword } from '../utils/password';

vi.mock('../config/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}));

vi.mock('../utils/jwt', () => ({
  signToken: vi.fn(() => 'signed-token'),
}));

import { prisma } from '../config/prisma';
import { loginUser, registerUser } from './auth.service';

const mockedFindUnique = vi.mocked(prisma.user.findUnique);
const mockedCreate = vi.mocked(prisma.user.create);

const safeUser = {
  id: 'user-1',
  email: 'test@example.com',
  name: 'Test User',
  avatar: null,
  createdAt: new Date('2026-01-01'),
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('registerUser', () => {
  it('creates the user with a hashed password and returns a token', async () => {
    mockedFindUnique.mockResolvedValue(null);
    mockedCreate.mockResolvedValue(safeUser as never);

    const result = await registerUser({
      email: '  TEST@Example.com ',
      password: 'password123',
      name: '  Test User ',
    });

    expect(result.user).toEqual(safeUser);
    expect(result.token).toBe('signed-token');

    const createArgs = mockedCreate.mock.calls[0][0];
    // Email normalized, name trimmed, password stored as a bcrypt hash.
    expect(createArgs.data.email).toBe('test@example.com');
    expect(createArgs.data.name).toBe('Test User');
    expect(createArgs.data.password).not.toBe('password123');
    expect(createArgs.data.password).toMatch(/^\$2/);
  });

  it('rejects duplicate emails with 409', async () => {
    mockedFindUnique.mockResolvedValue(safeUser as never);

    await expect(
      registerUser({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      })
    ).rejects.toMatchObject({ statusCode: 409 });
    expect(mockedCreate).not.toHaveBeenCalled();
  });
});

describe('loginUser', () => {
  it('returns the safe user and token for valid credentials', async () => {
    const password = await hashPassword('password123');
    mockedFindUnique.mockResolvedValue({ ...safeUser, password } as never);

    const result = await loginUser({
      email: 'TEST@example.com',
      password: 'password123',
    });

    expect(result.user).toEqual(safeUser);
    expect(result.token).toBe('signed-token');
    // The password hash must never appear in the returned user.
    expect(result.user).not.toHaveProperty('password');
  });

  it('rejects unknown emails with 401', async () => {
    mockedFindUnique.mockResolvedValue(null);

    await expect(
      loginUser({ email: 'nobody@example.com', password: 'password123' })
    ).rejects.toMatchObject({ statusCode: 401 });
  });

  it('rejects a wrong password with 401', async () => {
    const password = await hashPassword('correct-password');
    mockedFindUnique.mockResolvedValue({ ...safeUser, password } as never);

    await expect(
      loginUser({ email: 'test@example.com', password: 'wrong-password' })
    ).rejects.toBeInstanceOf(ApiError);
    await expect(
      loginUser({ email: 'test@example.com', password: 'wrong-password' })
    ).rejects.toMatchObject({ statusCode: 401 });
  });
});
