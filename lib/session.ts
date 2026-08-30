import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "crypto";

const SECRET = process.env.TOKEN_SECRET!;
const COOKIE = "admin_session";

export function makeSession(): string {
  const exp = Date.now() + 86_400_000;
  const sig = createHmac("sha256", SECRET).update(`admin.${exp}`).digest("hex");
  return `${exp}.${sig}`;
}

export function checkSession(val: string | undefined): boolean {
  if (!val) return false;
  const [exp, sig] = val.split(".");
  if (!exp || !sig) return false;

  // Number("") is 0 and Number("abc") is NaN; both would slip past a bare
  // `Date.now() > Number(exp)` comparison, since any comparison with NaN is
  // false. Reject anything that isn't a real timestamp.
  const expMs = Number(exp);
  if (!Number.isFinite(expMs) || Date.now() > expMs) return false;

  const expected = createHmac("sha256", SECRET).update(`admin.${exp}`).digest("hex");

  // Constant-time compare, matching lib/token.ts. `sig === expected` returns as
  // soon as two characters differ, which leaks how much of a forged signature
  // was correct — and this is the gate on the admin session.
  const a = Buffer.from(sig, "utf8");
  const b = Buffer.from(expected, "utf8");
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function isAdmin(): Promise<boolean> {
  const c = await cookies();
  return checkSession(c.get(COOKIE)?.value);
}

export async function clearSessionCookie() {
  const c = await cookies();
  c.delete(COOKIE);
}

export const SESSION_COOKIE = COOKIE;
