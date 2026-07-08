import { prisma } from '../config/prisma';
import { hashPassword, verifyPassword } from '../utils/password';
import { signToken } from '../utils/jwt';
import { ApiError } from '../utils/ApiError';
import { SafeUser } from '../types/auth';

export interface RegisterInput {
  email: string;
  password: string;
  name: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthResult {
  user: SafeUser;
  token: string;
}

/** Fields selected whenever we return a user (never the password hash). */
const safeUserSelect = {
  id: true,
  email: true,
  name: true,
  avatar: true,
  createdAt: true,
} as const;

/** Register a new user, returning the safe user and a signed JWT. */
export const registerUser = async (input: RegisterInput): Promise<AuthResult> => {
  const email = input.email.toLowerCase().trim();

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw ApiError.conflict('البريد الإلكتروني مستخدم بالفعل');
  }

  const passwordHash = await hashPassword(input.password);

  const user = await prisma.user.create({
    data: {
      email,
      password: passwordHash,
      name: input.name.trim(),
    },
    select: safeUserSelect,
  });

  const token = signToken({ userId: user.id });
  return { user, token };
};

/** Authenticate an existing user. */
export const loginUser = async (input: LoginInput): Promise<AuthResult> => {
  const email = input.email.toLowerCase().trim();

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw ApiError.unauthorized('البريد الإلكتروني أو كلمة المرور غير صحيحة');
  }

  const valid = await verifyPassword(input.password, user.password);
  if (!valid) {
    throw ApiError.unauthorized('البريد الإلكتروني أو كلمة المرور غير صحيحة');
  }

  const token = signToken({ userId: user.id });
  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      createdAt: user.createdAt,
    },
    token,
  };
};
