import { RequestHandler } from 'express';
import { ZodSchema } from 'zod';

/**
 * Validates `req.params`/`req.query` against a Zod schema before the request
 * reaches football-data.org. Without this, an arbitrary `:code` or `?status`
 * value is forwarded straight to the upstream API — harmless there, but it
 * also means our own cache grows one entry per garbage value an attacker
 * sends. Failures are passed to `next()` as a ZodError, which the central
 * error handler already formats into a 400 response.
 */
export const validateParams = (schema: ZodSchema): RequestHandler => (req, _res, next) => {
  const result = schema.safeParse(req.params);
  if (!result.success) {
    next(result.error);
    return;
  }
  next();
};

export const validateQuery = (schema: ZodSchema): RequestHandler => (req, _res, next) => {
  const result = schema.safeParse(req.query);
  if (!result.success) {
    next(result.error);
    return;
  }
  next();
};
