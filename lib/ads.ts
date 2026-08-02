/**
 * Origin that serves the ad frame HTML.
 *
 * The ad HTML must NOT be served from the main site's origin. Adsterra's
 * invoke.js reads document.cookie, and a sandboxed same-origin frame has to omit
 * allow-same-origin (otherwise the frame could reach parent.document, strip its
 * own sandbox attribute and reload unsandboxed — no boundary at all). Without
 * allow-same-origin the frame runs in an opaque origin, where document.cookie
 * throws:
 *
 *   Uncaught SecurityError: Failed to read the 'cookie' property from
 *   'Document': The document is sandboxed and lacks the 'allow-same-origin' flag
 *
 * The script dies on that line before rendering, so the frame stays blank with a
 * clean 200 on the network tab.
 *
 * Serving the ad HTML from a SEPARATE origin resolves both sides: the frame is
 * cross-origin to us, so allow-same-origin grants it only its own origin's
 * cookies and storage and never reaches our DOM, and invoke.js gets the cookie
 * access and referrer it needs to verify the publisher domain.
 *
 * Set NEXT_PUBLIC_ADS_ORIGIN to the second deployment's URL, with no trailing
 * slash, e.g. https://rube-shortner-ads.vercel.app
 */
const RAW = process.env.NEXT_PUBLIC_ADS_ORIGIN?.trim().replace(/\/+$/, "");

/**
 * Falls back to same-origin /ads/* when unset. That fallback still hits the
 * SecurityError above, so ads will not render until the separate origin is
 * deployed and this variable is set — but the site keeps working rather than
 * requesting a broken absolute URL.
 */
export const ADS_ORIGIN = RAW || "";

export function adUrl(file: string): string {
  return ADS_ORIGIN ? `${ADS_ORIGIN}/${file}` : `/ads/${file}`;
}
