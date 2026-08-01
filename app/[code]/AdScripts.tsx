"use client";
import { useEffect, useRef } from "react";

export default function AdScripts() {
  const fired = useRef(false);

  useEffect(() => {
    // Social bar is safe to load immediately, it doesn't navigate the page.
    const s2 = document.createElement("script");
    s2.src = "https://pl30636549.effectivecpmnetwork.com/8f/c0/e0/8fc0e0bbeec98414982958c8a7105a2e.js";
    s2.async = true;
    document.body.appendChild(s2);

    // Popunder only fires on a genuine user click, so the browser trusts
    // it as a real new-tab popup instead of it hijacking this tab.
    function onClick() {
      if (fired.current) return;
      fired.current = true;
      const s1 = document.createElement("script");
      s1.src = "https://pl30636546.effectivecpmnetwork.com/48/b5/1a/48b51a54c3811b46f8096507a03d3efb.js";
      s1.async = true;
      document.body.appendChild(s1);
      document.removeEventListener("click", onClick);
    }
    document.addEventListener("click", onClick);

    return () => {
      s2.remove();
      document.removeEventListener("click", onClick);
    };
  }, []);

  return null;
}
