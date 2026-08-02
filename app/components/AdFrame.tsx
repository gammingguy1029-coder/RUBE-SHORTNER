"use client";

/**
 * Renders a third-party ad unit inside a sandboxed iframe.
 *
 * Sandbox rationale — the permissions here are deliberate:
 *   allow-scripts                  ad script must run
 *   allow-popups                   creative click opens a new tab (without this, CTR is 0)
 *   allow-popups-to-escape-sandbox opened tab isn't itself sandboxed, so the
 *                                  landing page works normally
 *
 * Deliberately ABSENT:
 *   allow-top-navigation(-by-user-activation)  ad can never move the visitor's tab
 *   allow-same-origin                          frame runs in an opaque origin, so it
 *                                              cannot reach into parent DOM. Because
 *                                              these files are served from our own
 *                                              origin, combining allow-scripts with
 *                                              allow-same-origin would let the frame
 *                                              strip its own sandbox attribute — i.e.
 *                                              no sandbox at all. Omitting it is what
 *                                              makes this boundary real.
 */
export default function AdFrame({
  src,
  width,
  height,
  title = "Advertisement",
  className = "",
}: {
  src: string;
  width: number;
  height: number;
  title?: string;
  className?: string;
}) {
  return (
    <div className={`flex flex-col items-center gap-1 ${className}`}>
      <span className="text-[10px] uppercase tracking-wider text-neutral-600">
        Advertisement
      </span>
      <iframe
        src={src}
        title={title}
        width={width}
        height={height}
        loading="lazy"
        scrolling="no"
        referrerPolicy="strict-origin-when-cross-origin"
        sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox"
        className="block border-0 bg-transparent"
        style={{ width, height, maxWidth: "100%" }}
      />
    </div>
  );
}
