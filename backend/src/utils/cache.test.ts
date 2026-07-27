import { describe, expect, it, vi } from 'vitest';
import { TtlCache } from './cache';

describe('TtlCache', () => {
  it('returns the cached value without calling the producer again', async () => {
    const cache = new TtlCache(60_000);
    const producer = vi.fn().mockResolvedValue('value');

    await cache.wrap('key', producer);
    await cache.wrap('key', producer);

    expect(producer).toHaveBeenCalledTimes(1);
  });

  it('re-fetches once the TTL expires', async () => {
    vi.useFakeTimers();
    const cache = new TtlCache(1_000);
    const producer = vi.fn().mockResolvedValue('value');

    await cache.wrap('key', producer);
    vi.advanceTimersByTime(1_001);
    await cache.wrap('key', producer);

    expect(producer).toHaveBeenCalledTimes(2);
    vi.useRealTimers();
  });

  it('single-flights concurrent misses so only one producer call is made', async () => {
    const cache = new TtlCache(60_000);
    let resolveProducer: (value: string) => void;
    const producer = vi.fn(
      () =>
        new Promise<string>((resolve) => {
          resolveProducer = resolve;
        })
    );

    const first = cache.wrap('key', producer);
    const second = cache.wrap('key', producer);

    expect(producer).toHaveBeenCalledTimes(1);
    resolveProducer!('value');

    await expect(first).resolves.toBe('value');
    await expect(second).resolves.toBe('value');
  });

  it('does not cache a rejected producer, allowing a retry', async () => {
    const cache = new TtlCache(60_000);
    const producer = vi
      .fn()
      .mockRejectedValueOnce(new Error('upstream down'))
      .mockResolvedValueOnce('recovered');

    await expect(cache.wrap('key', producer)).rejects.toThrow('upstream down');
    await expect(cache.wrap('key', producer)).resolves.toBe('recovered');
    expect(producer).toHaveBeenCalledTimes(2);
  });
});
