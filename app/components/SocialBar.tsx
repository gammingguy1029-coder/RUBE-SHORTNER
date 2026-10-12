"use client";
import { useEffect } from "react";
import { SOCIAL_BAR } from "@/lib/adUnits";
import { reportAdResult } from "@/lib/adblock";

/**
 * Social Bar — floating notification-style ad on main domain.
 * Reports load result for adblock detection.
 */
export default function SocialBar() {
  useEffect(() => {
    if (document.querySelector(`script[src="${SOCIAL_BAR.scriptSrc}"]`)) return;
    const s = document.createElement("script");
    s.type = "text/javascript";
    s.src = SOCIAL_BAR.scriptSrc;
    s.async = true;
    s.setAttribute("data-cfasync", "false");

    let timer: ReturnType<typeof setTimeout> | undefined;
    let settled = false;
    const finish = (ok: boolean) => {
      if (settled) return;
      settled = true;
      if (timer !== undefined) clearTimeout(timer);
      reportAdResult(SOCIAL_BAR.adKey, ok);
    };
    timer = setTimeout(() => finish(false), 8000);
    s.onload = () => finish(true);
    s.onerror = () => finish(false);

    document.body.appendChild(s);
    return () => {
      if (timer !== undefined) clearTimeout(timer);
    };
  }, []);
  return null;
}
