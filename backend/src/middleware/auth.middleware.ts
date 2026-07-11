import { RequestHandler } from 'express';
import { prisma } from '../config/prisma';
import { verifyToken } from '../utils/jwt';
import { ApiError } from '../utils/ApiError';
import { AUTH_COOKIE } from '../utils/authCookie';

/** Extract the JWT from the httpOnly cookie, falling back to a Bearer header. */
const extractToken = (req: Parameters<RequestHandler>[0]): string | null => {
  const cookieToken = (req.cookies as Record<string, string> | undefined)?.[
    AUTH_COOKIE
  ];
  if (cookieToken) return cookieToken;

  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) {
    return header.slice('Bearer '.length).trim();
  }
  return null;
};

/**
 * Protect routes: require a valid session JWT (httpOnly cookie, or a
 * `Authorization: Bearer <token>` header for non-browser clients), verify it,
 * load the user, and attach a SafeUser to `req.user`.
 */
export const requireAuth: RequestHandler = async (req, _res, next) => {
  try {
    const token = extractToken(req);
    if (!token) {
      throw ApiError.unauthorized('لم يتم توفير رمز الدخول');
    }

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
