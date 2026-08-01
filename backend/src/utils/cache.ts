import Redis from 'ioredis';
import { env } from '../config/env';

/**
 * Shared shape for the in-memory and Redis-backed caches, so callers (the
 * football-data/api-football services) don't care which one they got.
 */
export interface Cache {
  wrap<T>(key: string, producer: () => Promise<T>, ttlMs?: number): Promise<T>;
}

/**
 * Tiny in-memory TTL cache. football-data.org's free tier allows only ~10
 * requests/minute, so we cache GET responses briefly to stay under the limit
 * and keep the UI snappy. Not suitable for multi-instance deployments — state
 * doesn't survive a restart and isn't shared across instances — see
 * `RedisCache` for that case.
 */
interface Entry<T> {
  value: T;
  expiresAt: number;
}

export class TtlCache implements Cache {
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

/**
 * Redis-backed TTL cache for multi-instance deployments (Render/Railway/Fly
 * free tiers spin up cold, and any host running >1 instance needs the cache
 * shared rather than per-process). In-flight de-duping is still per-process
 * only — Redis doesn't give us a free distributed lock here — but that's a
 * minor efficiency loss, not a correctness issue: worst case a couple of
 * instances race the same upstream call once.
 */
export class RedisCache implements Cache {
  private readonly inFlight = new Map<string, Promise<unknown>>();

  constructor(
    private readonly redis: Redis,
    private readonly defaultTtlMs: number = 60_000
  ) {}

  async wrap<T>(
    key: string,
    producer: () => Promise<T>,
    ttlMs: number = this.defaultTtlMs
  ): Promise<T> {
    const cached = await this.redis.get(key);
    if (cached !== null) {
      return JSON.parse(cached) as T;
    }

    const pending = this.inFlight.get(key);
    if (pending) {
      return pending as Promise<T>;
    }

    const promise = producer()
      .then(async (value) => {
        await this.redis.set(key, JSON.stringify(value), 'PX', ttlMs);
        return value;
      })
      .finally(() => {
        this.inFlight.delete(key);
      });

    this.inFlight.set(key, promise);
    return promise;
  }
}

let sharedRedis: Redis | undefined;

/**
 * Build a cache for the given default TTL — Redis-backed when `REDIS_URL` is
 * set (production, behind a real Redis instance), in-memory otherwise (local
 * dev, tests). One Redis connection is reused across all caches.
 */
export function createCache(defaultTtlMs: number): Cache {
  const url = env.REDIS_URL;
  if (!url) {
    return new TtlCache(defaultTtlMs);
  }

  if (!sharedRedis) {
    sharedRedis = new Redis(url, {
      maxRetriesPerRequest: 2,
      // Don't crash the process over transient Redis hiccups — just fail
      // that lookup and let the caller fall through to producer().
      lazyConnect: false,
    });
    sharedRedis.on('error', (err) => {
      // eslint-disable-next-line no-console
      console.error('Redis cache error:', err.message);
    });
  }

  return new RedisCache(sharedRedis, defaultTtlMs);
}

/** Close the shared Redis connection, if one was ever opened. Used on graceful shutdown. */
export async function closeCache(): Promise<void> {
  if (sharedRedis) {
    await sharedRedis.quit();
  }
}
