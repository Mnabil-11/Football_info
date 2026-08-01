import { env } from './config/env';
import { prisma } from './config/prisma';
import { closeCache } from './utils/cache';
import app from './app';

const server = app.listen(env.PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`🚀 API listening on http://localhost:${env.PORT}`);
});

// ── Graceful shutdown ───────────────────────────────────────────────────────
// On deploy/restart the platform sends SIGTERM; without this, in-flight
// requests get dropped mid-response instead of finishing first.
let shuttingDown = false;
const shutdown = (signal: string): void => {
  if (shuttingDown) {
    return;
  }
  shuttingDown = true;
  // eslint-disable-next-line no-console
  console.log(`${signal} received: closing server gracefully...`);

  server.close(() => {
    void Promise.allSettled([prisma.$disconnect(), closeCache()]).finally(() =>
      process.exit(0)
    );
  });

  // Belt-and-suspenders: force-exit if close() hangs (e.g. a stuck connection).
  setTimeout(() => process.exit(1), 10_000).unref();
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

export default app;
