import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import helmet from 'helmet';
import { env } from './config/env';
import apiRoutes from './routes';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';

/**
 * Express app assembly, separated from server.ts (which calls `.listen()` and
 * wires process signal handlers) so tests can import `app` and drive it with
 * supertest without binding a real port or triggering shutdown logic.
 */
const app: Application = express();

// ── Global middleware ──────────────────────────────────────────────────────
// In development Vite may fall back to another port (5174, 5175, …) when 5173
// is taken, so allow any localhost origin there; production stays locked to
// CLIENT_ORIGIN.
const corsOrigin =
  env.NODE_ENV === 'production'
    ? env.CLIENT_ORIGIN
    : [env.CLIENT_ORIGIN, /^https?:\/\/localhost(:\d+)?$/];

app.use(
  cors({
    origin: corsOrigin,
    credentials: true,
  })
);
// This is a JSON-only API (no HTML/scripts served), so CSP's directives are
// mostly moot — helmet's other headers (X-Content-Type-Options, HSTS, etc.)
// are the real value here. crossOriginResourcePolicy is relaxed to
// 'cross-origin' since the frontend legitimately consumes this API from a
// different origin (already scoped by the CORS config above).
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'none'"],
        frameAncestors: ["'none'"],
      },
    },
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);
app.use(compression());
app.use(express.json());
app.use(cookieParser());

// ── Health check ───────────────────────────────────────────────────────────
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({ success: true, status: 'ok', uptime: process.uptime() });
});

// ── API routes ─────────────────────────────────────────────────────────────
app.use('/api', apiRoutes);

// ── Error handling (must be last) ──────────────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
