import { RequestHandler } from 'express';

/**
 * Sets a public Cache-Control max-age matching the upstream TtlCache TTL for
 * this route, so browsers/CDNs skip re-requesting data that's still fresh
 * server-side. Combined with Express's default (weak) ETag, a client with a
 * stale-but-cached response gets a 304 instead of a full payload.
 */
export const cacheControl = (maxAgeSeconds: number): RequestHandler => {
  return (_req, res, next) => {
    res.set('Cache-Control', `public, max-age=${maxAgeSeconds}`);
    next();
  };
};
