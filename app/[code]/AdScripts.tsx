"use client";
import { useEffect } from "react";

export default function AdScripts() {
  useEffect(() => {
    const s2 = document.createElement("script");
    s2.src = "https://pl30636549.effectivecpmnetwork.com/8f/c0/e0/8fc0e0bbeec98414982958c8a7105a2e.js";
    s2.async = true;
    document.body.appendChild(s2);

    return () => {
      s2.remove();
    };
  }, []);

  return null;
}
