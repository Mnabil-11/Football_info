/**
 * Prisma understands a `schema` query param in the connection string, but the
 * underlying Postgres/Neon driver does not — passing it through can break the
 * connection. This strips Prisma-only params so the raw driver gets a clean URL,
 * and exposes the target schema separately for `SET search_path`.
 */
export interface ParsedDbUrl {
  /** Connection string safe to hand to the Neon `Pool`. */
  connectionString: string;
  /** The Postgres schema the app should use (defaults to "public"). */
  schema: string;
}

export const parseDbUrl = (raw: string): ParsedDbUrl => {
  const url = new URL(raw);
  const schema = url.searchParams.get('schema') ?? 'public';
  url.searchParams.delete('schema');
  return { connectionString: url.toString(), schema };
};
