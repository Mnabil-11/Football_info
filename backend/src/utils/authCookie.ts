import { CookieOptions, Response } from 'express';
import { env } from '../config/env';

/** Name of the httpOnly cookie carrying the session JWT. */
export const AUTH_COOKIE = 'ft_token';

// Mirrors JWT_EXPIRES_IN (7d): the cookie and the token expire together.
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

// `sameSite: 'lax'` is our CSRF defense: browsers withhold the cookie on
// cross-site POST/DELETE (only same-site requests or top-level navigations
// get it), so no separate CSRF token is needed — AS LONG AS the deployed
// frontend and this API stay on the same registrable domain (subdomains are
// fine, e.g. app.example.com + api.example.com). If they're ever split
// across unrelated domains, this degrades to `sameSite: 'none'` and a real
// CSRF token becomes mandatory. Prefer same-domain deployment over adding
// that complexity.
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
