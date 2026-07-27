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

export interface UpdateProfileInput {
  name?: string;
  avatar?: string | null;
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
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

/** Update the caller's own name and/or avatar URL. */
export const updateProfile = async (
  userId: string,
  input: UpdateProfileInput
): Promise<SafeUser> => {
  const data: { name?: string; avatar?: string | null } = {};
  if (input.name !== undefined) {
    data.name = input.name.trim();
  }
  if (input.avatar !== undefined) {
    data.avatar = input.avatar;
  }

  return prisma.user.update({
    where: { id: userId },
    data,
    select: safeUserSelect,
  });
};

/** Change the caller's password after verifying the current one. */
export const changePassword = async (
  userId: string,
  input: ChangePasswordInput
): Promise<void> => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw ApiError.unauthorized('المستخدم غير موجود');
  }

  const valid = await verifyPassword(input.currentPassword, user.password);
  if (!valid) {
    throw ApiError.unauthorized('كلمة المرور الحالية غير صحيحة');
  }

  const passwordHash = await hashPassword(input.newPassword);
  await prisma.user.update({
    where: { id: userId },
    data: { password: passwordHash },
  });
};

/**
 * Delete the caller's account after verifying their password. Favorites
 * (teams/players) and fantasy teams cascade-delete via the schema's
 * onDelete: Cascade — no separate cleanup needed here.
 */
export const deleteAccount = async (
  userId: string,
  password: string
): Promise<void> => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw ApiError.unauthorized('المستخدم غير موجود');
  }

  const valid = await verifyPassword(password, user.password);
  if (!valid) {
    throw ApiError.unauthorized('كلمة المرور غير صحيحة');
  }

  await prisma.user.delete({ where: { id: userId } });
};
