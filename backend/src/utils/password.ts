import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

/** Hash a plaintext password. */
export const hashPassword = (plain: string): Promise<string> =>
  bcrypt.hash(plain, SALT_ROUNDS);

/** Compare a plaintext password against a stored hash. */
export const verifyPassword = (
  plain: string,
  hash: string
): Promise<boolean> => bcrypt.compare(plain, hash);
