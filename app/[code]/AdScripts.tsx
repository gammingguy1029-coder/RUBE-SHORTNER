"use client";
import { useEffect } from "react";

export default function AdScripts() {
  useEffect(() => {
    const s1 = document.createElement("script");
    s1.src = "https://pl30636546.effectivecpmnetwork.com/48/b5/1a/48b51a54c3811b46f8096507a03d3efb.js";
    s1.async = true;
    document.body.appendChild(s1);

    const s2 = document.createElement("script");
    s2.src = "https://pl30636549.effectivecpmnetwork.com/8f/c0/e0/8fc0e0bbeec98414982958c8a7105a2e.js";
    s2.async = true;
    document.body.appendChild(s2);

    return () => {
      s1.remove();
      s2.remove();
    };
  }, []);

  return null;
}
