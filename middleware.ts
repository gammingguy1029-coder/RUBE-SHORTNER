import { NextRequest, NextResponse } from "next/server";

/** Ad network hosts that must be allowed to load scripts/frames/images. */
const AD_HOSTS = [
  "https://*.effectivecpmnetwork.com",
  "https://www.highperformanceformat.com",
  "https://*.highperformanceformat.com",
].join(" ");

/**
 * Static routes that would otherwise match the short-code pattern below.
 * "/privacy" (7), "/contact" (7) and "/disclaimer" (10) are all alphanumeric
 * and within the 6-12 length window, so without this list they would be served
 * the loosened ad-page CSP. Next.js still routes them to the correct static
 * page — only the headers were wrong. Add any future top-level page here.
 */
const RESERVED_PATHS = new Set([
  "/privacy",
  "/terms",
  "/disclaimer",
  "/contact",
  "/dmca",
  "/admin",
  "/robots.txt",
  "/sitemap.xml",
]);

export function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const { pathname, searchParams } = req.nextUrl;

  res.headers.set("X-Content-Type-Options", "nosniff");

  // Was "no-referrer" site-wide, which stripped the referrer from ad clicks.
  // Networks use the referrer for attribution and traffic-quality scoring, and
  // blank-referrer traffic is commonly devalued or flagged. This still hides the
  // full path (which contains the short code) but sends the origin.
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  const isCodePage =
    !RESERVED_PATHS.has(pathname) && /^\/[A-Za-z0-9]{6,12}$/.test(pathname);
  const isAdFrame = pathname.startsWith("/ads/");

  if (isAdFrame) {
    // These static files are the ad frames. The old matcher caught them and
    // applied X-Frame-Options: DENY plus script-src 'self', so the iframe was
    // refused and the ad script was CSP-blocked — the banners could never
    // appear. They must be framable by our own origin, and must be allowed to
    // load the network's script.
    res.headers.delete("X-Frame-Options");
    res.headers.set(
      "Content-Security-Policy",
      [
        "default-src 'none'",
        `script-src 'unsafe-inline' 'unsafe-eval' https:`,
        `frame-src https:`,
        `img-src https: data:`,
        `style-src 'unsafe-inline' https:`,
        `font-src https: data:`,
        `connect-src https:`,
        `frame-ancestors 'self'`,
      ].join("; ")
    );
    return res;
  }

  if (isCodePage) {
    res.headers.set(
      "Content-Security-Policy",
      [
        "default-src 'self'",
        `script-src 'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com ${AD_HOSTS}`,
        "frame-src 'self' https://challenges.cloudflare.com https:",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' https: data:",
        "connect-src 'self' https://challenges.cloudflare.com https:",
        // Previously the code page had NO frame protection at all, so anyone
        // could embed the unlocker in a hidden iframe and farm impressions —
        // invalid traffic attributed to our ad account.
        "frame-ancestors 'none'",
      ].join("; ")
    );
    res.headers.set("X-Frame-Options", "DENY");
  } else {
    res.headers.set("X-Frame-Options", "DENY");
    res.headers.set(
      "Content-Security-Policy",
      [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com",
        "frame-src 'self' https://challenges.cloudflare.com",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' https: data:",
        "connect-src 'self'",
        "frame-ancestors 'none'",
      ].join("; ")
    );
  }

  if (pathname.startsWith("/api/r/") && !searchParams.get("token")) {
    return NextResponse.json({ error: "Direct access forbidden" }, { status: 403 });
  }

  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
