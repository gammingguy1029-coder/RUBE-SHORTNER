"use client";
import { useEffect, useState } from "react";
import { AD_SCRIPT_URLS } from "@/lib/adUnits";

/**
 * Adblock detection.
 *
 * Two independent probes must BOTH report blocked before we treat the visitor
 * as blocked. Either probe alone produces false positives — a transient network
 * error trips the fetch probe, and unrelated CSS can trip the bait probe — and
 * a false positive here means locking out a legitimate visitor, which costs a
 * redirect and a real impression. Requiring agreement makes that much rarer.
 *
 * Returns "unknown" until both probes have finished, so callers never act on a
 * half-finished result.
 */
export type AdblockStatus = "unknown" | "clear" | "blocked";

/** Probe 1: can we actually fetch our own ad frame? Blockers match the URL. */
async function fetchProbe(): Promise<boolean> {
  // fetch() has no default timeout. A request that hangs rather than failing —
  // captive portal, dead DNS, a blocker that stalls the socket instead of
  // rejecting — left this await unsettled forever, so setStatus was never
  // called and the gate sat at "unknown" for the rest of the visit. The
  // countdown finished and the visitor could never proceed.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);
  try {
    const res = await fetch(`/ads/banner-300x250.html?probe=${Date.now()}`, {
      method: "GET",
      cache: "no-store",
      signal: controller.signal,
    });
    // A blocker typically aborts the request (throw) rather than returning a
    // status, so only a clear non-OK counts as blocked here.
    return !res.ok;
  } catch {
    // Includes the abort. Reads as blocked, but baitProbe still has to agree
    // before the visitor is gated, so a slow network alone can't lock them out.
    return true;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Probe 3: are the ad networks themselves reachable?
 *
 * This is the one that catches a VPN. Probes 1 and 2 only test our own origin
 * and our own DOM, and a VPN with ad-blocking DNS blocks neither — it blocks
 * highperformanceformat.com and effectivecpmnetwork.com. So both probes came
 * back clean while the real ad scripts were being dropped, and the visitor was
 * waved through to two permanently blank slots. Same blind spot for Pi-hole,
 * NextDNS, AdGuard DNS and most "blocks ads" VPN toggles.
 *
 * mode:"no-cors" is deliberate. We cannot read a cross-origin response and do
 * not need to: a blocked request rejects, a reachable one resolves opaque. That
 * also means no impression is recorded, so probing cannot inflate the ad count.
 * An opaque resolve does not prove the script is valid — a 403 resolves too —
 * only that DNS and the network path are intact, which is exactly the question.
 */
async function networkProbe(): Promise<boolean> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);

  try {
    const results = await Promise.all(
      AD_SCRIPT_URLS.map(async (url) => {
        try {
          await fetch(url, {
            mode: "no-cors",
            cache: "no-store",
            signal: controller.signal,
          });
          return true;
        } catch {
          return false;
        }
      })
    );
    // Every network unreachable. One failing is an outage or a stale key; all
    // failing at once is filtering.
    return results.every((ok) => !ok);
  } finally {
    clearTimeout(timer);
  }
}

/** Probe 2: does a bait element with ad-like classes get hidden or removed? */
function baitProbe(): boolean {
  const bait = document.createElement("div");
  bait.className =
    "adsbox ad-placement ad-banner sponsored-ad textads banner-ads";
  bait.setAttribute("data-ad-slot", "probe");
  // Off-screen but still laid out, so a real browser reports a non-zero box.
  bait.style.cssText =
    "position:absolute;left:-9999px;top:-9999px;width:300px;height:250px;pointer-events:none;";
  document.body.appendChild(bait);

  // Force layout before measuring.
  void bait.offsetHeight;

  const style = window.getComputedStyle(bait);
  const blocked =
    bait.offsetParent === null ||
    bait.offsetHeight === 0 ||
    bait.clientHeight === 0 ||
    style.display === "none" ||
    style.visibility === "hidden";

  bait.remove();
  return blocked;
}

export function useAdblockDetect(enabled: boolean): AdblockStatus {
  const [status, setStatus] = useState<AdblockStatus>("unknown");

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;

    // Small delay so a blocker's content scripts have applied their rules.
    const t = setTimeout(async () => {
      // Run both network-dependent probes together rather than in sequence, so
      // the worst case is one 5s timeout instead of two.
      const [byFetch, byNetwork] = await Promise.all([fetchProbe(), networkProbe()]);
      if (cancelled) return;
      const byBait = baitProbe();
      if (cancelled) return;

      // byNetwork is conclusive alone: if no ad network resolves, the ads
      // genuinely cannot load and there is nothing to serve. It does not need a
      // second opinion, and requiring one is what let VPN traffic through.
      //
      // byFetch and byBait still have to agree with each other, because either
      // alone produces false positives — a transient error trips the fetch and
      // unrelated CSS can trip the bait.
      setStatus(byNetwork || (byFetch && byBait) ? "blocked" : "clear");
    }, 900);

    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [enabled]);

  return status;
}
