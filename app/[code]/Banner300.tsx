"use client";
import { useEffect, useRef } from "react";

declare global {
  interface Window {
    atOptions?: Record<string, unknown>;
  }
}

export default function Banner300() {
  const ref = useRef<HTMLDivElement>(null);
  const loaded = useRef(false);

  useEffect(() => {
    if (loaded.current || !ref.current) return;
    loaded.current = true;

    const opts = document.createElement("script");
    opts.text = `atOptions = {
      'key' : '6e855ffe8642d5f59d1f63f665190696',
      'format' : 'iframe',
      'height' : 250,
      'width' : 300,
      'params' : {}
    };`;
    ref.current.appendChild(opts);

    const invoke = document.createElement("script");
    invoke.src = "https://www.highperformanceformat.com/6e855ffe8642d5f59d1f63f665190696/invoke.js";
    ref.current.appendChild(invoke);
  }, []);

  return <div ref={ref} className="flex justify-center" />;
}
