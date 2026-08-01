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
  const [adClicks, setAdClicks] = useState(0);
  const widgetRef = useRef<HTMLDivElement>(null);
  const rendered = useRef(false);

  const SMART_LINK =
    "https://www.effectivecpmnetwork.com/sm5xqczp?key=40edaf85ab1f07358dcb031a21ee4ce1";
  const SMART_LINK_2 =
    "https://www.effectivecpmnetwork.com/w3194snfs?key=28b8efa0c33161aee110d378e2a5c52a";
  const SMART_LINK_3 =
    "https://www.effectivecpmnetwork.com/zcsxs9q14a?key=5888a61216a1477ea1fb0951f57a5c6b";

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

  useEffect(() => {
    let fired = false;
    function onFirstTouch() {
      if (fired) return;
      fired = true;
      window.open(SMART_LINK_3, "_blank");
      document.removeEventListener("pointerdown", onFirstTouch);
    }
    document.addEventListener("pointerdown", onFirstTouch, { once: true });
    return () => document.removeEventListener("pointerdown", onFirstTouch);
  }, []);

  async function continueClick() {
    if (adClicks < 1) {
      window.open(SMART_LINK, "_blank");
      setAdClicks((c) => c + 1);
      return;
    }

    window.open(SMART_LINK_2, "_blank");

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
      {adClicks === 1 && !loading && (
        <p className="text-neutral-500 text-sm">Click Continue again to unlock your link</p>
      )}
      {err && <p className="text-red-400 text-sm">{err}</p>}
    </div>
  );
}
