import { RequestHandler } from 'express';
import { z } from 'zod';
import { loginUser, registerUser } from '../services/auth.service';
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
