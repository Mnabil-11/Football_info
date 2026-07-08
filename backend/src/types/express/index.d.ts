import { SafeUser } from '../auth';

// Augment Express's Request so `req.user` is strongly typed on protected routes.
declare global {
  namespace Express {
    interface Request {
      user?: SafeUser;
    }
  }
}

export {};
