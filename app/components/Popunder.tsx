"use client";
import { POPUNDER } from "@/lib/adUnits";
import { reportAdResult } from "@/lib/adblock";

/**
 * Popunder — triggered on user interaction (final Continue), not on mount.
 * Call loadPopunder() from the 2-of-2 click handler. No auto-inject on mount
 * to avoid firing during countdown.
 */
export function loadPopunder(): void {
  if (typeof document === "undefined") return;
  if (document.querySelector(`script[src="${POPUNDER.scriptSrc}"]`)) return;
  const s = document.createElement("script");
  s.type = "text/javascript";
  s.src = POPUNDER.scriptSrc;
  s.async = false;

  let timer: ReturnType<typeof setTimeout> | undefined;
  let settled = false;
  const finish = (ok: boolean) => {
    if (settled) return;
    settled = true;
    if (timer !== undefined) clearTimeout(timer);
    reportAdResult(POPUNDER.adKey, ok);
  };
  timer = setTimeout(() => finish(false), 8000);
  s.onload = () => finish(true);
  s.onerror = () => finish(false);

  document.head.appendChild(s);
}

export default function Popunder() {
  // No auto-load — triggered via loadPopunder() on user click (see Unlocker handleClick)
  return null;
}
