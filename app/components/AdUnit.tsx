"use client";
import { useEffect, useRef, useState } from "react";
import { reportAdResult } from "@/lib/adblock";

export default function AdUnit({
  adKey,
  width,
  height,
  variant,
  scriptSrc,
  className = "",
}: {
  adKey: string;
  width: number;
  height: number;
  variant: "banner" | "native";
  scriptSrc: string;
  className?: string;
}) {
  const host = useRef<HTMLDivElement>(null);
  const injected = useRef(false);
  // True until either the script has loaded, the inner iframe has reported, or
  // the timeout fires — used to keep the skeleton-shimmer visible in the slot.
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (injected.current || !host.current) return;
    injected.current = true;
    const hostEl = host.current;

    if (variant === "banner") {
      // iframe srcdoc isolation — each banner gets its own window.atOptions, no global race.
      // Uses postMessage from inside srcdoc so inner script onerror/onload is ground truth;
      // iframe.onload alone fires even when inner script is blocked, so it cannot be used.
      const iframe = document.createElement("iframe");
      iframe.width = String(width);
      iframe.height = String(height);
      iframe.scrolling = "no";
      iframe.setAttribute("frameborder", "0");
      iframe.style.border = "0";
      iframe.style.display = "block";
      let settled = false;
      let timer: ReturnType<typeof setTimeout> | undefined;
      const finish = (ok: boolean) => {
        if (settled) return;
        settled = true;
        if (timer !== undefined) clearTimeout(timer);
        reportAdResult(adKey, ok);
      };
      const onMessage = (e: MessageEvent) => {
        if (!e.data || e.data.type !== "adResult" || e.data.adKey !== adKey) return;
        finish(Boolean(e.data.ok));
        if (e.data.ok) setLoaded(true);
      };
      window.addEventListener("message", onMessage);
      // If banner never reports (slow network, very old browser without srcdoc), don't false-positive as blocked.
      // 12s gives async creatives time; we still fall back to blocked only after definite timeout.
      timer = setTimeout(() => finish(false), 12000);
      const esc = (s: string) =>
        s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/'/g, "&#39;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
      const html = `<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;padding:0;overflow:hidden;background:transparent}body{width:${width}px;height:${height}px}</style></head><body><script>window.atOptions=${JSON.stringify({ key: adKey, format: "iframe", height, width, params: {} })}<\/script><script>function _r(o){try{parent.postMessage({type:"adResult",adKey:"${esc(adKey)}",ok:o},"*")}catch(e){}}<\/script><script src="${esc(scriptSrc)}" onload="_r(true)" onerror="_r(false)"><\/script></body></html>`;
      (iframe as HTMLIFrameElement & { srcdoc: string }).srcdoc = html;
      hostEl.appendChild(iframe);
      return () => {
        window.removeEventListener("message", onMessage);
        if (timer !== undefined) clearTimeout(timer);
      };
    }

    // Native — per-key container, no global
    const script = document.createElement("script");
    script.type = "text/javascript";
    script.src = scriptSrc;
    script.async = true;
    script.setAttribute("data-cfasync", "false");

    let loadTimer: ReturnType<typeof setTimeout> | undefined;
    let settled = false;
    const finish = (ok: boolean) => {
      if (settled) return;
      settled = true;
      if (loadTimer !== undefined) clearTimeout(loadTimer);
      reportAdResult(adKey, ok);
    };
    loadTimer = setTimeout(() => finish(false), 8000);
    script.onload = () => { finish(true); setLoaded(true); };
    script.onerror = () => finish(false);

    hostEl.appendChild(script);
    return () => {
      if (loadTimer !== undefined) clearTimeout(loadTimer);
    };
  }, [adKey, width, height, variant, scriptSrc]);

  return (
    <div className={`flex flex-col items-center gap-1 animate-fadeIn ${className}`}>
      <span className="text-[10px] uppercase tracking-wider text-neutral-600">Advertisement</span>
      <div
        style={{ width, minHeight: height, maxWidth: "100%" }}
        className={`flex items-center justify-center rounded-lg border border-neutral-800/60 bg-neutral-900/20 p-2 card-lift transition-opacity duration-500 ${loaded ? "opacity-100" : "ad-skeleton"}`}
      >
        <div ref={host} />
        {variant === "native" && <div id={`container-${adKey}`} />}
      </div>
    </div>
  );
}
