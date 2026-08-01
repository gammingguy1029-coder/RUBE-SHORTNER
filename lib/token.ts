import { createHmac, timingSafeEqual } from "crypto";

const SECRET = process.env.TOKEN_SECRET!;
const TTL_MS = 60_000;

export function sign(code: string): string {
  const exp = Date.now() + TTL_MS;
  const payload = `${code}.${exp}`;
  const sig = createHmac("sha256", SECRET).update(payload).digest("hex");
  return Buffer.from(`${payload}.${sig}`).toString("base64url");
}

export function verify(token: string, code: string): boolean {
  try {
    const raw = Buffer.from(token, "base64url").toString();
    const [tCode, expStr, sig] = raw.split(".");
    if (tCode !== code) return false;
    if (Date.now() > Number(expStr)) return false;
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
