/**
 * Apply prisma/init.sql to the Neon database over the serverless driver (HTTPS).
 * This is our substitute for `prisma db push` on machines that cannot reach
 * Neon over IPv6 / TCP 5432. Safe to run once on an empty database.
 *
 * Usage: npm run db:push:neon
 */
import { setDefaultResultOrder } from 'node:dns';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import { env } from '../src/config/env';
import { parseDbUrl } from '../src/config/dbUrl';

setDefaultResultOrder('ipv4first');
neonConfig.webSocketConstructor = ws;

const run = async (): Promise<void> => {
  const sqlPath = join(__dirname, '..', 'prisma', 'init.sql');
  const sql = readFileSync(sqlPath, 'utf-8');

  const { connectionString, schema } = parseDbUrl(env.DATABASE_URL);

  // Create the dedicated schema and run the (unqualified) DDL inside it via
  // search_path, so our tables never collide with other apps in this database.
  // Statements run as one simple-query batch on a single connection, so the
  // SET search_path applies to every CREATE that follows.
  const batch = [
    `CREATE SCHEMA IF NOT EXISTS "${schema}";`,
    `SET search_path TO "${schema}";`,
    sql,
  ].join('\n');

  const pool = new Pool({ connectionString });
  try {
    // eslint-disable-next-line no-console
    console.log(`⏳ Applying init.sql to Neon (schema "${schema}")...`);
    await pool.query(batch);
    // eslint-disable-next-line no-console
    console.log('✅ Tables created successfully.');
  } finally {
    await pool.end();
  }
};

run().catch((err: unknown) => {
  // eslint-disable-next-line no-console
  console.error('❌ Failed to apply schema:', err);
  process.exit(1);
});
