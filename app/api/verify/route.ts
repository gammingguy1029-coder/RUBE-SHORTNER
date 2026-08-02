import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/supabase";
import { sign } from "@/lib/token";
import { rateLimit } from "@/lib/ratelimit";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  if (!rateLimit(`verify:${ip}`, 20, 60_000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const { code, turnstileToken } = await req.json();
  if (typeof code !== "string" || typeof turnstileToken !== "string") {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const tsRes = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      secret: process.env.TURNSTILE_SECRET_KEY!,
      response: turnstileToken,
      remoteip: ip,
    }),
  });
  const tsData = await tsRes.json();
  if (!tsData.success) {
    return NextResponse.json({ error: "Verification failed" }, { status: 403 });
  }

  const { data } = await db.from("links").select("enabled").eq("short_code", code).single();
  if (!data || !data.enabled) {
    return NextResponse.json({ error: "Link not found" }, { status: 404 });
  }

  return NextResponse.json({ token: sign(code) });
}
