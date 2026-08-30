"use client";
import { useEffect } from "react";
import { POPUNDER } from "@/lib/adUnits";

/**
 * Popunder — triggered on user interaction (final Continue).
 * Loaded early so it's ready when the visitor clicks; network will
 * handle frequency capping.
 */
export default function Popunder() {
  useEffect(() => {
    if (document.querySelector(`script[src="${POPUNDER.scriptSrc}"]`)) return;
    const s = document.createElement("script");
    s.type = "text/javascript";
    s.src = POPUNDER.scriptSrc;
    // Popunder snippets are typically sync; keep async false to match supplied snippet.
    s.async = false;
    document.head.appendChild(s);
  }, []);
  return null;
}
