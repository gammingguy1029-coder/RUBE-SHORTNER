"use client";
import { ADS_ORIGIN, adUrl } from "@/lib/ads";

/**
 * Renders a third-party ad unit inside a sandboxed iframe.
 *
 * No loading="lazy" — deliberate, do not add it back. The 300x250 unit sits
 * below the unlock button and the disclaimer text, so on a phone it starts below
 * the fold. Lazy defers the request until the frame nears the viewport, and in
 * this flow the visitor has no reason to scroll past the button they came for,
 * so that request was frequently never made at all: no render, no impression,
 * no revenue. Eager costs one extra request on a page that only ever shows two
 * ads, which is the right trade.
 *
 * Separate origin — the ad HTML is served from a second Vercel project (set
 * NEXT_PUBLIC_ADS_ORIGIN to its URL). The sandbox attributes are:
 *
 *   allow-scripts                  ad script must run
 *   allow-popups                   creative click opens a new tab
 *   allow-popups-to-escape-sandbox landing page works normally
 *   allow-same-origin              script can access its own cookies, localStorage
 *                                  and referrer, which Adsterra requires to verify
 *                                  the publisher domain. Safe here because the ad
 *                                  frame is cross-origin to the main site, so
 *                                  same-origin means the ads origin, not ours. The
 *                                  frame still cannot reach parent.document.
 *
 * Deliberately ABSENT:
 *   allow-top-navigation(-by-user-activation)  ad can never move the visitor's tab
 */
export default function AdFrame({
  unit,
  width,
  height,
  title = "Advertisement",
  className = "",
}: {
  /** File name only, e.g. "banner-300x250.html". Resolved against ADS_ORIGIN. */
  unit: string;
  width: number;
  height: number;
  title?: string;
  className?: string;
}) {
  // allow-same-origin is added ONLY when the frame is genuinely cross-origin.
  //
  // Granting it to a same-origin frame that also has allow-scripts is a full
  // sandbox escape: the frame can reach parent.document, delete its own sandbox
  // attribute and reload itself unsandboxed. Tying the flag to ADS_ORIGIN being
  // set means the unsafe combination cannot be deployed by accident — if the env
  // var is missing we fall back to same-origin /ads/* with the strict sandbox,
  // where ads stay broken but nothing is exposed.
  const crossOrigin = ADS_ORIGIN !== "";

  const sandbox = [
    "allow-scripts",
    crossOrigin ? "allow-same-origin" : null,
    "allow-popups",
    "allow-popups-to-escape-sandbox",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={`flex flex-col items-center gap-1 ${className}`}>
      <span className="text-[10px] uppercase tracking-wider text-neutral-600">
        Advertisement
      </span>
      <iframe
        src={adUrl(unit)}
        title={title}
        width={width}
        height={height}
        scrolling="no"
        referrerPolicy="strict-origin-when-cross-origin"
        sandbox={sandbox}
        className="block border-0 bg-transparent"
        style={{ width, height, maxWidth: "100%" }}
      />
    </div>
  );
}
