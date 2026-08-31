import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/supabase";
import { sign } from "@/lib/token";
import { rateLimit } from "@/lib/ratelimit";
import { clientIp } from "@/lib/clientIp";
import { CODE_RE } from "@/lib/shortCode";

export async function POST(req: NextRequest) {
  // Only the first hop. Using the whole header let an attacker change the
  // rate-limit key on every request just by appending a fake hop.
  const ip = clientIp(req);
  if (!rateLimit(`verify:${ip}`, 20, 60_000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const body = await req.json().catch(() => ({}));
  const { code, turnstileToken } = body ?? {};
  if (typeof code !== "string" || typeof turnstileToken !== "string") {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  // sign() builds a dot-delimited payload, so an unvalidated code could alter
  // the token's field layout. Reject anything that isn't a real short code.
  if (!CODE_RE.test(code)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  // A network blip talking to Cloudflare used to throw and return a 500. Fails
  // closed: no confirmed success means no token.
  let verified = false;
  try {
    const tsRes = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        secret: process.env.TURNSTILE_SECRET_KEY!,
        response: turnstileToken,
        remoteip: ip,
      }),
      signal: AbortSignal.timeout(10_000),
    });
    const tsData = await tsRes.json();
    verified = tsData?.success === true;
  } catch {
    verified = false;
  }
  if (!verified) {
    return NextResponse.json({ error: "Verification failed" }, { status: 403 });
  }

  // .maybeSingle(): .single() treats zero rows as an error, which is the normal
  // "no such code" case and not worth throwing over.
  const { data, error } = await db
    .from("links")
    .select("enabled")
    .eq("short_code", code)
    .maybeSingle();
  if (error) {
    console.error("[verify] db error", error.message);
    return NextResponse.json({ error: "Service temporarily unavailable" }, { status: 503 });
  }
  if (!data || !data.enabled) {
    return NextResponse.json({ error: "Link not found" }, { status: 404 });
  }

  return NextResponse.json({ token: sign(code) });
}
