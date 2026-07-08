import { RequestHandler } from 'express';
import { prisma } from '../config/prisma';
import { verifyToken } from '../utils/jwt';
import { ApiError } from '../utils/ApiError';

/**
 * Protect routes: require a valid `Authorization: Bearer <token>` header,
 * verify it, load the user, and attach a SafeUser to `req.user`.
 */
export const requireAuth: RequestHandler = async (req, _res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      throw ApiError.unauthorized('لم يتم توفير رمز الدخول');
    }

    const token = header.slice('Bearer '.length).trim();
    const { userId } = verifyToken(token);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw ApiError.unauthorized('المستخدم غير موجود');
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
};
