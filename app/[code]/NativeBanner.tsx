"use client";
import { useEffect, useRef } from "react";

export default function NativeBanner() {
  const ref = useRef<HTMLDivElement>(null);
  const loaded = useRef(false);

  useEffect(() => {
    if (loaded.current || !ref.current) return;
    loaded.current = true;
    const script = document.createElement("script");
    script.async = true;
    script.setAttribute("data-cfasync", "false");
    script.src = "https://pl30636548.effectivecpmnetwork.com/79c0adaa9e3d0f0084e7438b112f9fa9/invoke.js";
    ref.current.appendChild(script);
  }, []);

  return <div ref={ref} id="container-79c0adaa9e3d0f0084e7438b112f9fa9" />;
}
