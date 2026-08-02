import { NextRequest, NextResponse } from "next/server";
import { makeSession, SESSION_COOKIE } from "@/lib/session";
import {
  checkLoginAllowed,
  recordFailure,
  clearFailures,
  passwordMatches,
} from "@/lib/loginGuard";

export async function POST(req: NextRequest) {
  // x-forwarded-for is a comma-separated chain; the old code used the whole
  // header as the rate-limit key, so the key changed whenever an upstream hop
  // changed and the limit could be sidestepped.
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

  const gate = await checkLoginAllowed(ip);

  // Nested rather than two sibling `if`s: narrowing a discriminated union needs
  // the discriminant tested on its own. In `if (!gate.allowed && gate.reason ===
  // "unavailable")` the negative branch only tells TypeScript that the whole
  // conjunction was false, so `gate` stays the full union afterwards and reading
  // gate.retryAfterSec fails to compile.
  if (!gate.allowed) {
    if (gate.reason === "unavailable") {
      // The attempt store could not be read, so failures cannot be counted.
      // Login is refused rather than allowed through unprotected. Almost always
      // means supabase.sql has not been re-run to create login_attempts.
      return NextResponse.json(
        {
          error:
            "Login is temporarily unavailable. If you just deployed, re-run supabase.sql to create the login_attempts table.",
        },
        { status: 503 }
      );
    }

    const mins = Math.ceil(gate.retryAfterSec / 60);
    return NextResponse.json(
      {
        error: `Too many failed attempts. Try again in ${mins} minute${
          mins === 1 ? "" : "s"
        }.`,
      },
      { status: 429, headers: { "Retry-After": String(gate.retryAfterSec) } }
    );
  }

  const body = await req.json().catch(() => ({}));

  if (!passwordMatches(body?.password)) {
    await recordFailure(ip);
    // Deliberately vague, and identical regardless of why it failed.
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }

  await clearFailures(ip);

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
