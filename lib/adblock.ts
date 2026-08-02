"use client";
import { useEffect, useState } from "react";

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
  try {
    const res = await fetch(`/ads/banner-300x250.html?probe=${Date.now()}`, {
      method: "GET",
      cache: "no-store",
    });
    // A blocker typically aborts the request (throw) rather than returning a
    // status, so only a clear non-OK counts as blocked here.
    return !res.ok;
  } catch {
    return true;
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
      const byFetch = await fetchProbe();
      if (cancelled) return;
      const byBait = baitProbe();
      if (cancelled) return;
      setStatus(byFetch && byBait ? "blocked" : "clear");
    }, 900);

    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [enabled]);

  return status;
}
