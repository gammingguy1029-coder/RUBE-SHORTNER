import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/supabase";
import { verify } from "@/lib/token";
import { rateLimit } from "@/lib/ratelimit";

const CODE_RE = /^[A-Za-z0-9]{6,12}$/;

/**
 * Recovery page shown when the unlock token is missing, expired or already
 * used. This route previously returned raw JSON ({"error":"Invalid or expired
 * token"}), which is a dead end: the visitor had already sat through the
 * countdown and the advertisements, and then hit a wall of JSON with no way
 * back. That is a served impression with a lost redirect. Sending them back to
 * the unlock page lets them finish.
 *
 * Contains no ad scripts and opens nothing automatically — it is a plain
 * recovery page with one explicit link.
 */
function retryPage(code: string, message: string) {
  const safeCode = CODE_RE.test(code) ? code : "";
  const backLink = safeCode
    ? `<a class="btn" href="/${safeCode}">Try again</a>`
    : `<a class="btn" href="/">Go to homepage</a>`;

  return new NextResponse(
    `<!doctype html>
<html lang="en"><head><meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<meta name="robots" content="noindex, nofollow" />
<title>Link expired</title>
<style>
  body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;
    background:#0a0a0a;color:#e5e5e5;font-family:ui-sans-serif,system-ui,-apple-system,sans-serif;padding:24px}
  .card{max-width:26rem;text-align:center}
  h1{font-size:1.25rem;margin:0 0 .5rem}
  p{color:#a3a3a3;font-size:.875rem;line-height:1.6;margin:0 0 1.5rem}
  .btn{display:inline-block;background:#fff;color:#000;text-decoration:none;
    padding:.625rem 1.5rem;border-radius:.375rem;font-weight:500;font-size:.875rem}
  .links{margin-top:2rem;font-size:.75rem;color:#525252}
  .links a{color:#525252;margin:0 .4rem}
</style></head>
<body><div class="card">
  <h1>This unlock link expired</h1>
  <p>${message}</p>
  ${backLink}
  <div class="links">
    <a href="/privacy">Privacy</a><a href="/terms">Terms</a><a href="/disclaimer">Disclaimer</a>
  </div>
</div></body></html>`,
    {
      status: 403,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
      },
    }
  );
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const token = req.nextUrl.searchParams.get("token") ?? "";
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

  if (!CODE_RE.test(code)) {
    return retryPage("", "That link address is not valid.");
  }

  if (!rateLimit(`redirect:${ip}`, 30, 60_000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  if (!verify(token, code)) {
    return retryPage(
      code,
      "Your unlock code timed out or was already used. Head back and tap Continue again — it only takes a moment."
    );
  }

  const { data } = await db
    .from("links")
    .select("id, destination_url, enabled, views")
    .eq("short_code", code)
    .single();

  if (!data || !data.enabled) {
    return retryPage("", "This link is no longer available.");
  }

  // Fire-and-forget so a slow analytics write never delays the redirect. Note
  // this read-then-write can still undercount concurrent hits; see README.
  void db
    .from("links")
    .update({ views: (data.views ?? 0) + 1 })
    .eq("id", data.id);

  // A malformed destination_url would otherwise throw here and return a 500
  // instead of redirecting.
  try {
    return NextResponse.redirect(data.destination_url, { status: 302 });
  } catch {
    return retryPage("", "This link's destination is misconfigured.");
  }
}
