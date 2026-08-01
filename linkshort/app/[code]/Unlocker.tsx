"use client";
import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: Record<string, unknown>) => void;
    };
    onTurnstileLoad?: () => void;
  }
}

export default function Unlocker({ code }: { code: string }) {
  const [seconds, setSeconds] = useState(15);
  const [tsToken, setTsToken] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const widgetRef = useRef<HTMLDivElement>(null);
  const rendered = useRef(false);

  useEffect(() => {
    if (seconds <= 0) return;
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds]);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
    script.async = true;
    document.body.appendChild(script);
    const interval = setInterval(() => {
      if (window.turnstile && widgetRef.current && !rendered.current) {
        rendered.current = true;
        window.turnstile.render(widgetRef.current, {
          sitekey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
          callback: (t: string) => setTsToken(t),
        });
        clearInterval(interval);
      }
    }, 200);
    return () => clearInterval(interval);
  }, []);

  async function continueClick() {
    setLoading(true);
    setErr("");
    const res = await fetch("/api/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, turnstileToken: tsToken }),
    });
    const data = await res.json();
    if (!res.ok) {
      setLoading(false);
      setErr(data.error ?? "Verification failed");
      return;
    }
    window.location.href = `/api/r/${code}?token=${encodeURIComponent(data.token)}`;
  }

  const ready = seconds <= 0 && tsToken;

  return (
    <div className="flex flex-col items-center gap-4">
      {seconds > 0 && (
        <p className="text-4xl font-mono tabular-nums">{seconds}</p>
      )}
      <div ref={widgetRef} />
      <button
        onClick={continueClick}
        disabled={!ready || loading}
        className="bg-white text-black rounded px-6 py-2 font-medium disabled:opacity-40 w-full"
      >
        {loading ? "Redirecting..." : "Continue"}
      </button>
      {err && <p className="text-red-400 text-sm">{err}</p>}
    </div>
  );
}
