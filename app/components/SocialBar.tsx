"use client";
import { useEffect } from "react";
import { SOCIAL_BAR } from "@/lib/adUnits";

/**
 * Social Bar — floating notification-style ad.
 * Loaded once per unlock flow on main domain. Async-safe, no container.
 */
export default function SocialBar() {
  useEffect(() => {
    if (document.querySelector(`script[src="${SOCIAL_BAR.scriptSrc}"]`)) return;
    const s = document.createElement("script");
    s.type = "text/javascript";
    s.src = SOCIAL_BAR.scriptSrc;
    s.async = true;
    s.setAttribute("data-cfasync", "false");
    document.body.appendChild(s);
  }, []);
  return null;
}
