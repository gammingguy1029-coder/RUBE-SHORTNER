"use client";
import { useEffect, useState } from "react";
import { AD_SCRIPT_URLS } from "@/lib/adUnits";

/**
 * Adblock / ad-blocking-VPN detection.
 *
 * Four independent probes, each catching something the others miss. A visitor
 * is gated when at least two agree. Requiring two keeps a flaky CDN or a single
 * network blip from locking out a paying visitor; requiring more than two let
 * real blockers through, which is the failure this file exists to prevent.
 *
 * Returns "unknown" until every probe has settled, so callers never act on a
 * half-finished result.
 */
export type AdblockStatus = "unknown" | "clear" | "blocked";

const PROBE_TIMEOUT_MS = 4000;

/**
 * Bait script for probe 1.
 *
 * Deliberately NOT one of our own ad scripts. Ours are obscure, so filter-list
 * coverage of them is patchy, which makes them a weak signal. This URL is on
 * essentially every list — EasyList, AdGuard, the default Pi-hole and NextDNS
 * blocklists — so it is the closest thing to a universal canary. Loading it
 * records no impression for us and, with no adsbygoogle slot on the page, the
 * script is inert if it does load.
 */
const BAIT_SCRIPT =
  "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js";

/**
 * Probe 1: does a universally blocklisted ad script load?
 *
 * A script tag sidesteps CORS entirely and reports the same success or failure
 * the real ad units will get, which makes it the strongest single signal. It
 * also catches DNS-level blocking a same-origin check cannot see: the URL is
 * HTTPS, so a sinkhole answering on plain HTTP fails the TLS handshake and
 * fires onerror rather than quietly serving a blank page.
 */
function scriptProbe(): Promise<boolean> {
  return new Promise((resolve) => {
    const script = document.createElement("script");
    let settled = false;

    const finish = (blocked: boolean) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      script.remove();
      resolve(blocked);
    };

    // A blocker that stalls the socket instead of rejecting would otherwise
    // leave this promise pending forever and strand the gate at "unknown".
    const timer = setTimeout(() => finish(true), PROBE_TIMEOUT_MS);

    script.onerror = () => finish(true);
    script.onload = () => finish(false);
    script.async = true;
    script.src = `${BAIT_SCRIPT}?_=${Date.now()}`;
    document.head.appendChild(script);
  });
}

/**
 * Probe 2: are our own ad networks reachable?
 *
 * ANY unreachable domain counts. This previously required every domain to fail,
 * which is why detection never fired: www.highperformanceformat.com is on the
 * common filter lists but the randomised effectivecpmnetwork subdomain usually
 * is not, so one request always succeeded and the probe reported clear while
 * half the inventory was being dropped.
 *
 * mode:"no-cors" is deliberate. We cannot read a cross-origin response and do
 * not need to: a blocked request rejects, a reachable one resolves opaque. That
 * also means no impression is recorded, so probing cannot inflate the ad count.
 * An opaque resolve does not prove the script is valid — a 403 resolves too —
 * only that DNS and the network path are intact, which is the question here.
 */
async function networkProbe(): Promise<boolean> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);

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
    return results.some((ok) => !ok);
  } finally {
    clearTimeout(timer);
  }
}

/** Probe 3: can we fetch our own ad frame? Blockers match the /ads/ URL. */
async function fetchProbe(): Promise<boolean> {
  // fetch() has no default timeout. A request that hangs rather than failing —
  // captive portal, dead DNS, a blocker that stalls the socket instead of
  // rejecting — left this await unsettled forever, so setStatus was never
  // called and the gate sat at "unknown" for the rest of the visit.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);
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
    return true;
  } finally {
    clearTimeout(timer);
  }
}

/** Probe 4: does a bait element with ad-like classes get hidden or removed? */
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
      // Run the network-dependent probes together rather than in sequence, so
      // the worst case is one timeout instead of three.
      const [byScript, byNetwork, byFetch] = await Promise.all([
        scriptProbe(),
        networkProbe(),
        fetchProbe(),
      ]);
      if (cancelled) return;
      const byBait = baitProbe();
      if (cancelled) return;

      // Two-of-four. Each probe sees a different layer — third-party script
      // loading, our own ad domains, our own origin, and page cosmetics — so a
      // blocker has to stay invisible to three of them to get through. One
      // signal alone is not enough: transient errors trip the network probes
      // and unrelated CSS trips the bait.
      const signals = [byScript, byNetwork, byFetch, byBait].filter(Boolean).length;
      setStatus(signals >= 2 ? "blocked" : "clear");
    }, 900);

    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [enabled]);

  return status;
}
