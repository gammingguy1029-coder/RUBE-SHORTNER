export function GET() {
  const base = process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/+$/, "") || "https://example.com";
  const pages = ["", "privacy", "terms", "disclaimer", "contact", "dmca"];
  const urls = pages
    .map((p) => `  <url><loc>${base}/${p}</loc><changefreq>weekly</changefreq><priority>${p === "" ? "1.0" : "0.6"}</priority></url>`)
    .join("\n");
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;
  return new Response(xml, {
    headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=86400" },
  });
}
