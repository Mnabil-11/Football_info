/**
 * Tiny in-memory TTL cache. football-data.org's free tier allows only ~10
 * requests/minute, so we cache GET responses briefly to stay under the limit
 * and keep the UI snappy. Not suitable for multi-instance deployments (use
 * Redis there), but perfect for a single-process dev/demo backend.
 */
interface Entry<T> {
  value: T;
  expiresAt: number;
}

export class TtlCache {
  private readonly store = new Map<string, Entry<unknown>>();

  constructor(private readonly defaultTtlMs: number = 60_000) {}

  get<T>(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) {
      return undefined;
    }
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }
    return entry.value as T;
  }

  set<T>(key: string, value: T, ttlMs: number = this.defaultTtlMs): void {
    this.store.set(key, { value, expiresAt: Date.now() + ttlMs });
  }

  /** Return the cached value, or compute + cache it via `producer`. */
  async wrap<T>(
    key: string,
    producer: () => Promise<T>,
    ttlMs: number = this.defaultTtlMs
  ): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== undefined) {
      return cached;
    }
    const value = await producer();
    this.set(key, value, ttlMs);
    return value;
  }
}
