"use client";
import { useEffect, useState } from "react";

/**
 * Adblock / ad-blocking-VPN detection.
 *
 * Two kinds of signal, deliberately different in nature:
 *
 * 1. The REAL outcome. AdUnit reports whether each ad script actually loaded.
 *    A script element's onerror fires on DNS failure, on an ad-blocker abort,
 *    AND on an HTTP error status — so this one signal covers extensions, DNS
 *    blocklists, and an ad network refusing the request. It is ground truth
 *    rather than inference, so it is conclusive on its own.
 *
 * 2. Pre-emptive probes. Cheap same-origin checks that catch the common
 *    extension blockers before the ad scripts even get a chance, so those
 *    visitors never stare at empty slots. Both must agree, because either alone
 *    false-positives and a false positive costs a real visitor.
 *
 * Returns "unknown" until there is something to act on.
 *
 * Two earlier designs failed here and are worth not repeating. A no-cors fetch
 * to the ad domains cannot detect a 403: an opaque response resolves whatever
 * the status, so refused traffic read as reachable. And a <script> bait pointed
 * at pagead2.googlesyndication.com is blocked by our own CSP in middleware.ts,
 * which allowlists only Cloudflare and the two ad hosts — so it reported
 * "blocked" for every visitor on the planet.
 */
export type AdblockStatus = "unknown" | "clear" | "blocked";

const PROBE_TIMEOUT_MS = 4000;

/* ------------------------------------------------------------------ *
 * Real ad-load outcomes, reported by AdUnit.
 *
 * Module-level on purpose: it survives the remount that happens when the gate
 * panel swaps out the ad units, so a detected block stays latched instead of
 * oscillating. A full page reload clears it, which is exactly what the
 * "I've disabled it — re-check" button does.
 * ------------------------------------------------------------------ */

const failedUnits = new Set<string>();
const listeners = new Set<() => void>();

/** Called by AdUnit once its script either loads or fails. */
export function reportAdResult(adKey: string, ok: boolean) {
  const had = failedUnits.has(adKey);
  if (ok) failedUnits.delete(adKey);
  else failedUnits.add(adKey);
  if (had !== failedUnits.has(adKey)) listeners.forEach((fn) => fn());
}

/** Probe A: can we fetch a same-origin /ads/ URL? Blockers match the /ads/ path. */
async function fetchProbe(): Promise<boolean> {
  // fetch() has no default timeout. A request that hangs rather than failing —
  // captive portal, dead DNS, a blocker that stalls the socket instead of
  // rejecting — left this await unsettled forever, so setStatus was never
  // called and the gate sat at "unknown" for the rest of the visit.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);
  try {
    const res = await fetch(`/ads/probe.html?probe=${Date.now()}`, {
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

/** Probe B: does a bait element with ad-like classes get hidden or removed? */
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
  const [adFailed, setAdFailed] = useState(false);
  const [probed, setProbed] = useState<boolean | null>(null);

  /* Subscribe to the real ad-load outcomes. */
  useEffect(() => {
    const sync = () => setAdFailed(failedUnits.size > 0);
    listeners.add(sync);
    // A unit may have already reported before this effect ran.
    sync();
    return () => {
      listeners.delete(sync);
    };
  }, []);

  /* Run the pre-emptive probes. */
  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;

    // Small delay so a blocker's content scripts have applied their rules.
    const t = setTimeout(async () => {
      const byFetch = await fetchProbe();
      if (cancelled) return;
      const byBait = baitProbe();
      if (cancelled) return;
      setProbed(byFetch && byBait);
    }, 900);

    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [enabled]);

  // Ground truth wins and needs no second opinion: if an ad script did not
  // load, there is no ad to show, whatever the probes think.
  if (adFailed) return "blocked";
  if (!enabled || probed === null) return "unknown";
  return probed ? "blocked" : "clear";
}
