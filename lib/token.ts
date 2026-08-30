import { createHmac, timingSafeEqual } from "crypto";

const SECRET = process.env.TOKEN_SECRET!;

// Was 60_000 (60s). The unlock flow deliberately sends the visitor to an ad in
// another tab, and on mobile that tab often takes over the screen for longer
// than a minute. When they came back and tapped Continue the token had already
// expired, so they got a 403 — an ad view served with the redirect lost, which
// is the worst possible outcome. 10 minutes is still short enough that a leaked
// URL is near-useless.
const TTL_MS = 10 * 60_000;

export function sign(code: string): string {
  const exp = Date.now() + TTL_MS;
  const payload = `${code}.${exp}`;
  const sig = createHmac("sha256", SECRET).update(payload).digest("hex");
  return Buffer.from(`${payload}.${sig}`).toString("base64url");
}

export function verify(token: string, code: string): boolean {
  try {
    const raw = Buffer.from(token, "base64url").toString();
    const parts = raw.split(".");
    // Exactly three fields. A token with extra dots would otherwise have its
    // tail silently ignored by destructuring.
    if (parts.length !== 3) return false;
    const [tCode, expStr, sig] = parts;
    if (!tCode || !expStr || !sig) return false;
    if (tCode !== code) return false;

    // Number("abc") is NaN and every NaN comparison is false, so a bare
    // `Date.now() > Number(expStr)` passes junk straight through the expiry gate.
    const expMs = Number(expStr);
    if (!Number.isFinite(expMs) || Date.now() > expMs) return false;
    const expected = createHmac("sha256", SECRET)
      .update(`${tCode}.${expStr}`)
      .digest("hex");
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
