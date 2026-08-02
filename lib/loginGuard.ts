import { timingSafeEqual, createHash } from "crypto";
import { db } from "@/lib/supabase";

/**
 * Brute-force protection for admin login.
 *
 * Attempts are recorded in Postgres rather than memory. lib/ratelimit.ts keeps
 * counters in a module-level Map, which on Vercel means they reset on every
 * cold start and aren't shared between concurrent instances — an attacker can
 * reset the counter just by pacing requests, so it never really limited login.
 *
 * Lockout is progressive and tracked per IP.
 */

const MAX_ATTEMPTS = 5;

/** How long a run of failures keeps accumulating before it counts as a new run. */
const WINDOW_MS = 15 * 60_000;

/** Lockout duration by consecutive-failure count past the threshold. */
function lockoutMs(failures: number): number {
  if (failures < MAX_ATTEMPTS) return 0;
  const over = failures - MAX_ATTEMPTS;
  // 1m, 5m, 15m, 60m, then capped at 24h.
  const steps = [60_000, 300_000, 900_000, 3_600_000, 86_400_000];
  return steps[Math.min(over, steps.length - 1)];
}

/**
 * Whether a stored streak has gone cold and should reset to zero.
 *
 * Without this the failures counter only ever grows. Once it passed
 * MAX_ATTEMPTS the "old failures no longer count" check below could never fire
 * again, so lockoutMs kept returning the capped 24h: an admin who forgot their
 * password got exactly one attempt per day, forever, with no way back. Decay is
 * measured from the last attempt and must outlast that attempt's own lockout,
 * so serving a lockout and then staying quiet is what clears the streak. An
 * attacker who keeps trying never goes quiet, so their streak never decays.
 */
function isStale(failures: number, lastAttemptMs: number): boolean {
  return Date.now() - lastAttemptMs > lockoutMs(failures) + WINDOW_MS;
}

/** Never store or log a raw IP for this; a hash is enough to count attempts. */
function ipKey(ip: string): string {
  return createHash("sha256")
    .update(`${ip}:${process.env.TOKEN_SECRET ?? ""}`)
    .digest("hex")
    .slice(0, 32);
}

type AttemptRow = { failures: number; last_attempt: string };

/**
 * Reads the current streak.
 *
 * Returns null for "no record" and throws for a genuine database fault, so the
 * caller can tell the two apart. .maybeSingle() is deliberate: .single() treats
 * zero rows as an error, which made a first-time visitor indistinguishable from
 * a missing table.
 */
async function readAttempts(key: string): Promise<AttemptRow | null> {
  const { data, error } = await db
    .from("login_attempts")
    .select("failures, last_attempt")
    .eq("ip_hash", key)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data as AttemptRow | null;
}

export type LoginGate =
  | { allowed: true }
  | { allowed: false; reason: "locked"; retryAfterSec: number }
  | { allowed: false; reason: "unavailable" };

export async function checkLoginAllowed(ip: string): Promise<LoginGate> {
  const key = ipKey(ip);

  let row: AttemptRow | null;
  try {
    row = await readAttempts(key);
  } catch {
    // Fail CLOSED. The previous version swallowed every error and returned
    // allowed:true, so if supabase.sql hadn't been re-run to create
    // login_attempts — the common case on an existing deployment — the table
    // was missing, every query errored, and the brute-force protection was
    // silently inert while still appearing to work. Refusing logins is the
    // safe direction for an admin gate: it costs the owner a locked door,
    // where the alternative costs unlimited password guesses.
    return { allowed: false, reason: "unavailable" };
  }

  if (!row) return { allowed: true };

  const last = new Date(row.last_attempt).getTime();
  const failures = row.failures ?? 0;

  // Unparseable timestamp — treat as no usable record rather than locking out.
  if (!Number.isFinite(last)) return { allowed: true };

  if (isStale(failures, last)) return { allowed: true };

  const lock = lockoutMs(failures);
  const until = last + lock;
  if (lock > 0 && Date.now() < until) {
    return {
      allowed: false,
      reason: "locked",
      retryAfterSec: Math.max(1, Math.ceil((until - Date.now()) / 1000)),
    };
  }
  return { allowed: true };
}

export async function recordFailure(ip: string): Promise<void> {
  const key = ipKey(ip);

  let row: AttemptRow | null;
  try {
    row = await readAttempts(key);
  } catch (e) {
    // Do NOT fall through to the write. Without the current count the only value
    // we could write is 1, which would reset a streak that may already be at 20
    // — handing an attacker a counter reset for free every time a read blips.
    // Leaving the stored row untouched is strictly safer, and checkLoginAllowed
    // fails closed on this same read, so the door is shut either way.
    console.error(
      "[loginGuard] could not read attempts, streak left unchanged:",
      e instanceof Error ? e.message : e
    );
    return;
  }

  const last = row ? new Date(row.last_attempt).getTime() : 0;
  const prior = row?.failures ?? 0;
  const continuing = row !== null && Number.isFinite(last) && !isStale(prior, last);
  // Read-then-write, so two simultaneous failed logins can both read the same
  // count and one increment is lost. Not worth an RPC: the lockout still trips,
  // just possibly one attempt later.
  const failures = continuing ? prior + 1 : 1;

  const { error } = await db
    .from("login_attempts")
    .upsert(
      { ip_hash: key, failures, last_attempt: new Date().toISOString() },
      { onConflict: "ip_hash" }
    );

  if (error) {
    // Surfaced in Vercel logs. A silent failure here means failures stop being
    // counted at all, which is the one outcome that must not go unnoticed.
    console.error("[loginGuard] could not record failed attempt:", error.message);
  }
}

export async function clearFailures(ip: string): Promise<void> {
  const { error } = await db
    .from("login_attempts")
    .delete()
    .eq("ip_hash", ipKey(ip));
  if (error) {
    console.error("[loginGuard] could not clear attempts:", error.message);
  }
}

/**
 * Constant-time password comparison.
 *
 * The old check was `password !== process.env.ADMIN_PASSWORD`, a plain string
 * compare that short-circuits on the first differing character. Hashing both
 * sides first also means timingSafeEqual always gets equal-length buffers,
 * which it requires.
 */
export function passwordMatches(input: unknown): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (typeof input !== "string" || !expected) return false;
  const a = createHash("sha256").update(input).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}
