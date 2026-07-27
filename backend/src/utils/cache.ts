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
  // Tracks producers currently in flight so concurrent misses for the same
  // key share one upstream request instead of each firing their own — without
  // this, a burst of requests for an uncached key could blow through
  // football-data.org's ~10 req/min limit on its own.
  private readonly inFlight = new Map<string, Promise<unknown>>();

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

  /**
   * Return the cached value, or compute + cache it via `producer`. Concurrent
   * calls for the same key while the value is still missing reuse the same
   * in-flight producer call rather than each triggering their own.
   */
  async wrap<T>(
    key: string,
    producer: () => Promise<T>,
    ttlMs: number = this.defaultTtlMs
  ): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== undefined) {
      return cached;
    }

    const pending = this.inFlight.get(key);
    if (pending) {
      return pending as Promise<T>;
    }

    const promise = producer()
      .then((value) => {
        this.set(key, value, ttlMs);
        return value;
      })
      .finally(() => {
        this.inFlight.delete(key);
      });

    this.inFlight.set(key, promise);
    return promise;
  }
}
