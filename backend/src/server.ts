import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from './config/env';
import apiRoutes from './routes';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';

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

app.listen(env.PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`🚀 API listening on http://localhost:${env.PORT}`);
});

export default app;
