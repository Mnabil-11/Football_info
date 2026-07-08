import jwt, { SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';

/** Shape of the data we embed in the JWT. */
export interface JwtPayload {
  userId: string;
}

/** Sign a JWT for the given user id. */
export const signToken = (payload: JwtPayload): string => {
  const options: SignOptions = {
    expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn'],
  };
  return jwt.sign(payload, env.JWT_SECRET, options);
};

/**
 * Verify and decode a JWT. Throws if the token is invalid or expired.
 * Returns a strongly-typed payload (no `any`).
 */
export const verifyToken = (token: string): JwtPayload => {
  const decoded = jwt.verify(token, env.JWT_SECRET);
  if (
    typeof decoded === 'object' &&
    decoded !== null &&
    'userId' in decoded &&
    typeof (decoded as Record<string, unknown>).userId === 'string'
  ) {
    return { userId: (decoded as Record<string, string>).userId };
  }
  throw new Error('Invalid token payload');
};
