import { setDefaultResultOrder } from 'node:dns';
import { Pool, neonConfig } from '@neondatabase/serverless';
import { PrismaNeon } from '@prisma/adapter-neon';
import { PrismaClient } from '@prisma/client';
import ws from 'ws';
import { env } from './env';
import { parseDbUrl } from './dbUrl';

// This machine cannot route to AWS over IPv6, and both Node and the Neon driver
// otherwise prefer the IPv6 address. Force IPv4 resolution globally so the
// WebSocket connection to Neon (over HTTPS/443) succeeds.
setDefaultResultOrder('ipv4first');

// The Neon serverless driver connects over WebSockets; provide the ws impl.
neonConfig.webSocketConstructor = ws;

/**
 * Singleton PrismaClient backed by the Neon serverless driver adapter.
 * Using the adapter routes queries over HTTPS/WebSocket (443) instead of raw
 * TCP 5432, which avoids the local IPv6/port-5432 connectivity problem and
 * works well with Neon's connection pooler.
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pool: Pool | undefined;
};

// The Neon driver gets a clean URL (Prisma-only `schema` param stripped).
// Table names are qualified with the `football` schema via Prisma's multiSchema
// feature, so no search_path is needed — which is important because Neon's
// pooled connection rejects a search_path startup option.
const { connectionString } = parseDbUrl(env.DATABASE_URL);

const pool = globalForPrisma.pool ?? new Pool({ connectionString });

const adapter = new PrismaNeon(pool);

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: ['error', 'warn'],
  });

if (env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
  globalForPrisma.pool = pool;
}
