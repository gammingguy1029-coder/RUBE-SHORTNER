/**
 * Best-effort in-process rate limiter.
 *
 * Per-instance and lost on cold start, so it slows bursts rather than enforcing
 * a hard ceiling. Anything that must not be bypassed belongs in Postgres — see
 * lib/loginGuard.ts.
 */
const hits = new Map<string, number[]>();

/**
 * Hard ceiling on tracked keys. Nothing used to be evicted, so every distinct
 * key allocated an array that outlived its timestamps. Keys are derived from
 * client-supplied IPs, so varied traffic grew the Map until the instance ran out
 * of memory — and once it dies the limiter is gone, which is the opposite of
 * what it's for.
 */
const MAX_KEYS = 10_000;

function sweep(now: number, windowMs: number): void {
  for (const [k, times] of hits) {
    const live = times.filter((t) => now - t < windowMs);
    if (live.length === 0) hits.delete(k);
    else hits.set(k, live);
  }
}

export function rateLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();

  if (hits.size >= MAX_KEYS) {
    sweep(now, windowMs);
    // Still full after sweeping: every key is live, which means a flood of
    // distinct keys. Drop the oldest-inserted (Map preserves insertion order) so
    // memory stays bounded instead of refusing everyone.
    while (hits.size >= MAX_KEYS) {
      const oldest = hits.keys().next();
      if (oldest.done) break;
      hits.delete(oldest.value);
    }
  }

  const arr = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (arr.length >= max) {
    // Re-store the pruned array so a caller sitting on the limit doesn't keep
    // the expired timestamps around.
    hits.set(key, arr);
    return false;
  }
  arr.push(now);
  hits.set(key, arr);
  return true;
}
