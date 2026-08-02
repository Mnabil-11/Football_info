import { CookieOptions, Response } from 'express';
import { env } from '../config/env';

/** Name of the httpOnly cookie carrying the session JWT. */
export const AUTH_COOKIE = 'ft_token';

/**
 * Derive the cookie maxAge from JWT_EXPIRES_IN so they always stay in sync.
 * Supports formats like '7d', '24h', '30m', '3600s'. Falls back to 7 days.
 */
function parseDurationMs(expiresIn: string): number {
  const match = expiresIn.match(/^(\d+)([dhms])$/);
  if (!match) return 7 * 24 * 60 * 60 * 1000;
  const value = parseInt(match[1], 10);
  const multipliers: Record<string, number> = { d: 86_400_000, h: 3_600_000, m: 60_000, s: 1_000 };
  return value * (multipliers[match[2]] ?? 86_400_000);
}

const COOKIE_MAX_AGE_MS = parseDurationMs(env.JWT_EXPIRES_IN);

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
  res.cookie(AUTH_COOKIE, token, { ...baseOptions, maxAge: COOKIE_MAX_AGE_MS });
};

/** Remove the session cookie (logout). */
export const clearAuthCookie = (res: Response): void => {
  res.clearCookie(AUTH_COOKIE, baseOptions);
};
