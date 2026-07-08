import { ErrorRequestHandler, RequestHandler } from 'express';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import { ApiError } from '../utils/ApiError';

/** 404 handler for unknown routes. */
export const notFoundHandler: RequestHandler = (req, res) => {
  res.status(404).json({
    success: false,
    message: `المسار غير موجود: ${req.method} ${req.originalUrl}`,
  });
};

/**
 * Centralized error handler. Must have 4 args for Express to treat it as one.
 * Translates known error types into consistent JSON responses.
 */
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  // Validation errors from zod.
  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      message: 'بيانات غير صالحة',
      errors: err.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      })),
    });
    return;
  }

  // Our own operational errors.
  if (err instanceof ApiError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
    return;
  }

  // Prisma unique-constraint violation.
  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
    res.status(409).json({
      success: false,
      message: 'السجل موجود مسبقاً',
    });
    return;
  }

  // JWT errors.
  if (err instanceof Error && err.name === 'JsonWebTokenError') {
    res.status(401).json({ success: false, message: 'رمز غير صالح' });
    return;
  }
  if (err instanceof Error && err.name === 'TokenExpiredError') {
    res.status(401).json({ success: false, message: 'انتهت صلاحية الجلسة' });
    return;
  }

  // Fallback: unexpected error.
  // eslint-disable-next-line no-console
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    message: 'حدث خطأ في الخادم',
  });
};
