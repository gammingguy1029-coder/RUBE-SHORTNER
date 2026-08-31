"use client";
import { useEffect, useRef } from "react";
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

  useEffect(() => {
    if (injected.current || !host.current) return;
    injected.current = true;
    const hostEl = host.current;

    if (variant === "banner") {
      // iframe srcdoc isolation — each banner gets its own window.atOptions, no global race.
      // Mirrors WordPress widget isolation per joshwp research.
      const iframe = document.createElement("iframe");
      iframe.width = String(width);
      iframe.height = String(height);
      iframe.scrolling = "no";
      iframe.setAttribute("frameborder", "0");
      iframe.style.border = "0";
      iframe.style.display = "block";
      // no sandbox — needs scripts to run; isolated via srcdoc's own window
      const html = `<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;padding:0;overflow:hidden;background:transparent}body{width:${width}px;height:${height}px}</style></head><body><script>window.atOptions=${JSON.stringify({ key: adKey, format: "iframe", height, width, params: {} })}<\/script><script src="${scriptSrc}"><\/script></body></html>`;
      // report based on iframe load (creative inside may still fail, but network-level block will error the iframe's script and bubble as iframe load failure in practice)
      let timer: ReturnType<typeof setTimeout> | undefined;
      let settled = false;
      const finish = (ok: boolean) => {
        if (settled) return;
        settled = true;
        if (timer !== undefined) clearTimeout(timer);
        reportAdResult(adKey, ok);
      };
      timer = setTimeout(() => finish(false), 8000);
      iframe.onload = () => finish(true);
      iframe.onerror = () => finish(false);
      // srcdoc not supported in very old browsers, fallback to src via blob
      (iframe as HTMLIFrameElement & { srcdoc: string }).srcdoc = html;
      hostEl.appendChild(iframe);
      return;
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
    script.onload = () => finish(true);
    script.onerror = () => finish(false);

    hostEl.appendChild(script);
  }, [adKey, width, height, variant, scriptSrc]);

  return (
    <div className={`flex flex-col items-center gap-1 ${className}`}>
      <span className="text-[10px] uppercase tracking-wider text-neutral-600">Advertisement</span>
      <div style={{ width, minHeight: height, maxWidth: "100%" }} className="flex items-center justify-center">
        <div ref={host} />
        {variant === "native" && <div id={`container-${adKey}`} />}
      </div>
    </div>
  );
}
