import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const res = NextResponse.next();
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("Referrer-Policy", "no-referrer");
  const isCodePage = /^\/[A-Za-z0-9]{6,12}$/.test(req.nextUrl.pathname);
  if (!isCodePage) {
    res.headers.set("X-Frame-Options", "DENY");
    res.headers.set(
      "Content-Security-Policy",
      "default-src 'self'; script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com; frame-src https://challenges.cloudflare.com; style-src 'self' 'unsafe-inline'; connect-src 'self';"
    );
  } else {
    res.headers.set(
      "Content-Security-Policy",
      "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https:; frame-src https:; style-src 'self' 'unsafe-inline'; connect-src 'self' https:; img-src 'self' https: data:;"
    );
  }

  if (req.nextUrl.pathname.startsWith("/api/r/") && !req.nextUrl.searchParams.get("token")) {
    return NextResponse.json({ error: "Direct access forbidden" }, { status: 403 });
  }

  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
