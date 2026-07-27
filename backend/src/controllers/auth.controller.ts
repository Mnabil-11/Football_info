import { RequestHandler } from 'express';
import { z } from 'zod';
import {
  changePassword,
  deleteAccount,
  loginUser,
  registerUser,
  updateProfile,
} from '../services/auth.service';
import { ApiError } from '../utils/ApiError';
import { clearAuthCookie, setAuthCookie } from '../utils/authCookie';

const registerSchema = z.object({
  email: z.string().email('البريد الإلكتروني غير صالح'),
  password: z.string().min(6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'),
  name: z.string().min(2, 'الاسم قصير جداً'),
});

const loginSchema = z.object({
  email: z.string().email('البريد الإلكتروني غير صالح'),
  password: z.string().min(1, 'كلمة المرور مطلوبة'),
});

const updateProfileSchema = z.object({
  name: z.string().min(2, 'الاسم قصير جداً').optional(),
  avatar: z.string().url('رابط الصورة غير صالح').nullable().optional(),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'كلمة المرور الحالية مطلوبة'),
  newPassword: z.string().min(6, 'كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل'),
});

const deleteAccountSchema = z.object({
  password: z.string().min(1, 'كلمة المرور مطلوبة لتأكيد الحذف'),
});

/** POST /api/auth/register */
export const register: RequestHandler = async (req, res, next) => {
  try {
    const data = registerSchema.parse(req.body);
    const result = await registerUser(data);
    setAuthCookie(res, result.token);
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

/** POST /api/auth/login */
export const login: RequestHandler = async (req, res, next) => {
  try {
    const data = loginSchema.parse(req.body);
    const result = await loginUser(data);
    setAuthCookie(res, result.token);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

/** GET /api/auth/me (protected) */
export const me: RequestHandler = (req, res, next) => {
  try {
    if (!req.user) {
      throw ApiError.unauthorized();
    }
    res.status(200).json({ success: true, data: { user: req.user } });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/logout
 * Clears the httpOnly session cookie. With stateless JWTs the server holds no
 * session, so this is all logout needs; kept as an endpoint to allow future
 * token-blacklisting without changing the client contract.
 */
export const logout: RequestHandler = (_req, res) => {
  clearAuthCookie(res);
  res.status(200).json({ success: true, message: 'تم تسجيل الخروج' });
};

/** Guard: every route below is protected by requireAuth, so req.user must exist. */
const requireUserId = (userId: string | undefined): string => {
  if (!userId) {
    throw ApiError.unauthorized();
  }
  return userId;
};

/** PATCH /api/auth/profile (protected) — update name and/or avatar URL. */
export const updateProfileHandler: RequestHandler = async (req, res, next) => {
  try {
    const userId = requireUserId(req.user?.id);
    const data = updateProfileSchema.parse(req.body);
    const user = await updateProfile(userId, data);
    res.status(200).json({ success: true, data: { user } });
  } catch (err) {
    next(err);
  }
};

/** PATCH /api/auth/password (protected) — change password after verifying the current one. */
export const changePasswordHandler: RequestHandler = async (req, res, next) => {
  try {
    const userId = requireUserId(req.user?.id);
    const data = changePasswordSchema.parse(req.body);
    await changePassword(userId, data);
    res.status(200).json({ success: true, message: 'تم تغيير كلمة المرور' });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/auth/me (protected) — permanently delete the account after
 * verifying the password. Clears the session cookie since the account (and
 * therefore the JWT's userId) no longer exists.
 */
export const deleteAccountHandler: RequestHandler = async (req, res, next) => {
  try {
    const userId = requireUserId(req.user?.id);
    const { password } = deleteAccountSchema.parse(req.body);
    await deleteAccount(userId, password);
    clearAuthCookie(res);
    res.status(200).json({ success: true, message: 'تم حذف الحساب' });
  } catch (err) {
    next(err);
  }
};
