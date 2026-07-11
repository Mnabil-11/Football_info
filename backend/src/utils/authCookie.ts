import { CookieOptions, Response } from 'express';
import { env } from '../config/env';

/** Name of the httpOnly cookie carrying the session JWT. */
export const AUTH_COOKIE = 'ft_token';

// Mirrors JWT_EXPIRES_IN (7d): the cookie and the token expire together.
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

const baseOptions: CookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  secure: env.NODE_ENV === 'production',
  path: '/',
};

/** Attach the session JWT as an httpOnly cookie (XSS cannot read it). */
export const setAuthCookie = (res: Response, token: string): void => {
  res.cookie(AUTH_COOKIE, token, { ...baseOptions, maxAge: SEVEN_DAYS_MS });
};

/** Remove the session cookie (logout). */
export const clearAuthCookie = (res: Response): void => {
  res.clearCookie(AUTH_COOKIE, baseOptions);
};
