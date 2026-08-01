import { NextRequest, NextResponse } from "next/server";
import { makeSession, SESSION_COOKIE } from "@/lib/session";
import { rateLimit } from "@/lib/ratelimit";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  if (!rateLimit(`login:${ip}`, 5, 60_000)) {
    return NextResponse.json({ error: "Too many attempts" }, { status: 429 });
  }
  const { password } = await req.json();
  if (password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, makeSession(), {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    maxAge: 86_400,
    path: "/",
  });
  return res;
}
