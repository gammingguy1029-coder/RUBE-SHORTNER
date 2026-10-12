export function GET() {
  const base = process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/+$/, "") || "https://example.com";
  const body = `User-agent: *
Allow: /
Allow: /privacy
Allow: /terms
Allow: /disclaimer
Allow: /contact
Allow: /dmca
Disallow: /admin
Disallow: /api/
Sitemap: ${base}/sitemap.xml
`;
  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=86400" },
  });
}
