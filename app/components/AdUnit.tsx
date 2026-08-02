"use client";
import { useEffect, useRef } from "react";

/**
 * Renders an Adsterra unit directly in the page.
 *
 * Why not an iframe. The sandboxed-iframe version (AdFrame) put the ad in an
 * opaque origin, where invoke.js throws on document.cookie:
 *
 *   SecurityError: Failed to read the 'cookie' property from 'Document':
 *   The document is sandboxed and lacks the 'allow-same-origin' flag
 *
 * Serving the frame from a second origin fixes that, but Adsterra ties each ad
 * unit to the website it was created under, so keys minted for the main domain
 * return 403 when loaded from anywhere else. New keys per origin would be needed.
 * In-page keeps the existing approved keys on the approved domain.
 *
 * The trade-off is real and deliberate: this script runs in the page's own
 * context, so it can read the DOM, unlike the sandboxed frame it replaces. This
 * is how ad-supported shorteners generally operate, and it is what makes the
 * existing keys work. Keep it in mind before adding a second network.
 */
export default function AdUnit({
  adKey,
  width,
  height,
  /** Adsterra "native"/container units fill a div; "banner" units use atOptions. */
  variant,
  scriptSrc,
  className = "",
}: {
  adKey: string;
  width: number;
  height: number;
  variant: "banner" | "native";
  scriptSrc: string;
  className?: string;
}) {
  const host = useRef<HTMLDivElement>(null);
  const injected = useRef(false);

  useEffect(() => {
    // React 18+ StrictMode runs effects twice in development. Without this guard
    // the script is appended twice and the network bills two impressions for one
    // view, which is the kind of thing that gets an account flagged.
    if (injected.current || !host.current) return;
    injected.current = true;

    if (variant === "banner") {
      // atOptions must be defined as a global BEFORE invoke.js runs — the script
      // reads it at execution time.
      //
      // Only ONE banner unit can be on a page. atOptions is a single global, so
      // a second banner would overwrite it before the first invoke.js executes
      // (async scripts have no ordering guarantee) and both slots would render
      // the same unit. Native units use a per-key container div and are exempt.
      const config = document.createElement("script");
      config.type = "text/javascript";
      config.text = `window.atOptions = ${JSON.stringify({
        key: adKey,
        format: "iframe",
        height,
        width,
        params: {},
      })};`;
      host.current.appendChild(config);
    }

    const script = document.createElement("script");
    script.type = "text/javascript";
    script.src = scriptSrc;
    script.async = true;
    // Cloudflare rewrites third-party scripts unless told not to; Adsterra's
    // own snippet sets this and the script can misbehave without it.
    script.setAttribute("data-cfasync", "false");
    host.current.appendChild(script);
  }, [adKey, width, height, variant, scriptSrc]);

  return (
    <div className={`flex flex-col items-center gap-1 ${className}`}>
      {/* Labelling ad space is required by most networks' policies and by the
          disclosure rules the legal pages already commit to. */}
      <span className="text-[10px] uppercase tracking-wider text-neutral-600">
        Advertisement
      </span>
      {/* Reserves the slot so the page doesn't shift when the creative arrives.
          minHeight rather than height: native units size themselves and can come
          back taller than requested. */}
      <div
        style={{ width, minHeight: height, maxWidth: "100%" }}
        className="flex items-center justify-center"
      >
        <div ref={host} />
        {variant === "native" && (
          // Adsterra's native snippet fills this specific container id.
          <div id={`container-${adKey}`} />
        )}
      </div>
    </div>
  );
}
