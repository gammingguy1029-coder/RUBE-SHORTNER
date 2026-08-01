import { cookies } from "next/headers";
import { createHmac } from "crypto";

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
  if (Date.now() > Number(exp)) return false;
  const expected = createHmac("sha256", SECRET).update(`admin.${exp}`).digest("hex");
  return sig === expected;
}

export async function isAdmin(): Promise<boolean> {
  const c = await cookies();
  return checkSession(c.get(COOKIE)?.value);
}

export const SESSION_COOKIE = COOKIE;
