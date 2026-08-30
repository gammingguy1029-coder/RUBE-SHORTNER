"use client";
import { useEffect, useRef } from "react";
import { reportAdResult } from "@/lib/adblock";

// Module-level banner queue — serializes window.atOptions banner loads so two
// banner units on the same page don't race. Native units are exempt.
/* eslint-disable @typescript-eslint/no-explicit-any */
let bannerQueue: Promise<void> = Promise.resolve();

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

    const doInject = () => {
      if (variant === "banner") {
        const config = document.createElement("script");
        config.type = "text/javascript";
        config.text = `window.atOptions = ${JSON.stringify({
          key: adKey,
          format: "iframe",
          height,
          width,
          params: {},
        })};`;
        hostEl.appendChild(config);
      }

      const script = document.createElement("script");
      script.type = "text/javascript";
      script.src = scriptSrc;

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

      if (variant === "native") {
        script.async = true;
        script.setAttribute("data-cfasync", "false");
      } else {
        script.async = false;
      }
      hostEl.appendChild(script);
    };

    if (variant === "banner") {
      // Queue banner injections so atOptions isn't overwritten before invoke.js reads it.
      bannerQueue = bannerQueue.then(
        () =>
          new Promise<void>((resolve) => {
            doInject();
            // Give banner invoke.js time to read atOptions before next banner overwrites it.
            setTimeout(resolve, 1200);
          })
      );
    } else {
      doInject();
    }
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
