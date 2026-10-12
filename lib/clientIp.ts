import type { NextRequest } from "next/server";

/**
 * First hop of x-forwarded-for.
 *
 * The header is a client-controlled comma-separated chain: a request can arrive
 * with "1.1.1.1, 2.2.2.2" where only the last entry was added by our proxy.
 * Using the whole header as a rate-limit key lets an attacker change the key on
 * every request by appending a fake hop, which silently disables the limit. On
 * Vercel the first entry is the one the platform sets, so that is the one to use.
 */
export function clientIp(req: NextRequest): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}
