"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import AdUnit from "@/app/components/AdUnit";
import SocialBar from "@/app/components/SocialBar";
import Popunder, { loadPopunder } from "@/app/components/Popunder";
import { SMART_LINKS } from "@/lib/smartLinks";
import { useAdblockDetect } from "@/lib/adblock";

declare global {
  interface Window {
    turnstile?: {
      /** Returns a widget ID. The previous `void` return type discarded it,
       *  which made reset() impossible — see resetCaptcha below. */
      render: (
        el: HTMLElement | string,
        opts: Record<string, unknown>
      ) => string | undefined;
      reset: (widgetId?: string) => void;
      remove: (widgetId?: string) => void;
      getResponse: (widgetId?: string) => string | undefined;
    };
  }
}

const COUNTDOWN_SECONDS = 15;
const CONSENT_KEY = "ls_consent_v1";
/** Turnstile script is treated as failed if it hasn't defined window.turnstile
 *  by now. Without this the old code polled forever and left the button
 *  permanently disabled with no message — a silently dead page. */
const TURNSTILE_LOAD_TIMEOUT_MS = 12_000;

/**
 * Opens a sponsor link in a new tab.
 *
 * "noopener" is required: without it the opened ad tab can reach back through
 * window.opener and navigate THIS tab, which is the one thing that must never
 * happen. The trade-off is that window.open returns null whenever noopener is
 * set, so the return value cannot be used to detect a blocked popup. That is
 * why the UI offers an explicit "didn't open?" link instead of guessing.
 */
function openSponsor(url: string) {
  window.open(url, "_blank", "noopener");
}

export default function Unlocker({ code }: { code: string }) {
  const [consent, setConsent] = useState(false);
  const [consentLoaded, setConsentLoaded] = useState(false);
  const [seconds, setSeconds] = useState(COUNTDOWN_SECONDS);
  const [tsToken, setTsToken] = useState("");
  const [tsReady, setTsReady] = useState(false);
  const [tsFailed, setTsFailed] = useState(false);
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const widgetHost = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | undefined>(undefined);
  const rendered = useRef(false);

  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  // Only probe after consent, so the check runs once the visitor is actually in
  // the flow rather than on arrival.
  const adblock = useAdblockDetect(consent);

  /* Restore a previous consent so returning visitors aren't asked every time. */
  useEffect(() => {
    try {
      if (localStorage.getItem(CONSENT_KEY) === "1") setConsent(true);
    } catch {
      /* private mode / storage disabled — visitor just consents again */
    }
    setConsentLoaded(true);
  }, []);

  const acceptConsent = useCallback(() => {
    setConsent(true);
    try {
      localStorage.setItem(CONSENT_KEY, "1");
    } catch {
      /* non-fatal */
    }
  }, []);

  /* Countdown, resumed across refreshes.
      Previously useState(COUNTDOWN_SECONDS) restarted the full wait on every
      reload, so an accidental refresh (or coming back from a sponsor tab on a
      browser that reloaded the page) cost the visitor another 15s and lost
      redirects. The deadline is stored per-code in sessionStorage, so a refresh
      resumes where it left off but a genuinely new visit starts fresh.
      Gated on consent so the 15s is actual ad-view time, not time spent reading
      the consent gate before any ad has rendered. */
  useEffect(() => {
    if (!consent) return;
    const key = `ls_deadline_${code}`;
    let deadline: number;
    try {
      const saved = Number(sessionStorage.getItem(key));
      // Valid if it's a real number no further out than one full countdown.
      // A deadline already in the past is still valid — it means the visitor
      // finished waiting, and reloading must NOT put them back to 15s.
      const valid =
        Number.isFinite(saved) &&
        saved > 0 &&
        saved <= Date.now() + COUNTDOWN_SECONDS * 1000;
      deadline = valid ? saved : Date.now() + COUNTDOWN_SECONDS * 1000;
      sessionStorage.setItem(key, String(deadline));
    } catch {
      deadline = Date.now() + COUNTDOWN_SECONDS * 1000;
    }

    // `let`, declared before tick, and assigned after. The previous version had
    // `tick()` on the line ABOVE `const id = setInterval(...)`, so the first
    // synchronous tick reached `clearInterval(id)` while `id` was still in the
    // temporal dead zone — a hard ReferenceError that unmounted the whole page.
    // It only fired when the restored deadline had already passed, i.e. exactly
    // when someone refreshed after the countdown finished: the one path this
    // feature exists to support. The guard below is what makes the early call
    // safe, since on that first tick there is no interval to clear yet.
    let id: ReturnType<typeof setInterval> | undefined;

    const tick = () => {
      const left = Math.ceil((deadline - Date.now()) / 1000);
      setSeconds(left > 0 ? left : 0);
      if (left <= 0 && id !== undefined) clearInterval(id);
    };

    tick();
    // Only start ticking if there is actually time left. Without this, a resumed
    // deadline in the past would spin a 250ms interval forever, re-setting state
    // to the same 0 on every tick for as long as the visitor stayed on the page.
    if (Math.ceil((deadline - Date.now()) / 1000) > 0) {
      id = setInterval(tick, 250);
    }
    return () => {
      if (id !== undefined) clearInterval(id);
    };
  }, [code, consent]);

  /** Mint a fresh Turnstile token after one is consumed, expires, or errors. */
  const resetCaptcha = useCallback(() => {
    setTsToken("");
    try {
      window.turnstile?.reset(widgetId.current);
    } catch {
      setTsFailed(true);
    }
  }, []);

  /* 1. Load the Turnstile script as soon as terms are accepted.
     Deliberately early: the widget itself isn't shown until step 1, but by then
     the visitor has just opened a sponsor tab, which backgrounds this one and
     causes browsers to throttle its timers. Loading the script during the
     countdown means it is already in place when they return. */
  useEffect(() => {
    if (!consent) return;
    if (!siteKey) {
      // NEXT_PUBLIC_* is inlined at build time; if it's unset the widget would
      // render with an undefined sitekey and fail silently.
      setTsFailed(true);
      return;
    }
    if (window.turnstile) {
      setTsReady(true);
      return;
    }

    let cancelled = false;
    const SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js";

    const poll = setInterval(() => {
      if (!cancelled && window.turnstile) {
        clearInterval(poll);
        setTsReady(true);
      }
    }, 150);

    // The old code polled forever with no timeout, so if the script never
    // arrived the button stayed disabled with no message at all — a silently
    // dead page and a lost redirect.
    const timeout = setTimeout(() => {
      clearInterval(poll);
      if (!cancelled && !window.turnstile) setTsFailed(true);
    }, TURNSTILE_LOAD_TIMEOUT_MS);

    if (!document.querySelector(`script[src="${SRC}"]`)) {
      const script = document.createElement("script");
      script.src = SRC;
      script.async = true;
      script.defer = true;
      // Blocked by an ad blocker, DNS blocklist or corporate proxy.
      script.onerror = () => {
        if (!cancelled) setTsFailed(true);
      };
      document.head.appendChild(script);
    }

    return () => {
      cancelled = true;
      clearInterval(poll);
      clearTimeout(timeout);
    };
  }, [consent, siteKey]);

  /* 2. Render the widget once the script is up and its host div is mounted. */
  useEffect(() => {
    if (!tsReady || !siteKey || step < 1 || seconds > 0) return;
    if (rendered.current || !widgetHost.current || !window.turnstile) return;

    rendered.current = true;
    try {
      widgetId.current = window.turnstile.render(widgetHost.current, {
        sitekey: siteKey,
        theme: "dark",
        callback: (t: string) => {
          setTsToken(t);
          setErr("");
        },
        // Tokens are single-use and expire 300s after they're issued
        // (Cloudflare docs). None of these hooks existed before, so an expired
        // token left stale state in React: `ready` stayed true, the button
        // stayed enabled, the server rejected the token, and the visitor was
        // stuck with no way to retry.
        "expired-callback": () => setTsToken(""),
        "timeout-callback": () => setTsToken(""),
        "error-callback": () => {
          setTsToken("");
          setTsFailed(true);
        },
      });
    } catch {
      rendered.current = false;
      setTsFailed(true);
    }
  }, [tsReady, siteKey, step, seconds]);

  /**
   * Step 0 -> opens sponsor link 1, advances.
   * Step 1 -> opens sponsor link 2, verifies, redirects.
   *
   * Every window.open here is a direct, synchronous result of a tap on a button
   * that says what it does. The old code additionally opened a link from a
   * document-level "pointerdown" listener, so the first tap anywhere on the page
   * fired a popup. That has been removed: it broke the captcha by stealing focus
   * mid-challenge, and because a browser allows only one popup per user gesture,
   * tapping Continue fired two opens at once and the second was silently
   * blocked — a lost impression that still incremented the counter.
   */
  // Pick a random Smartlink per click to spread across the 6 offers (unlimited)
  function pickLink(offset = 0): string {
    // Deterministic rotation + random to avoid same link twice in a row
    const idx = (step + offset + Math.floor(Math.random() * SMART_LINKS.length)) % SMART_LINKS.length;
    return SMART_LINKS[idx];
  }

  async function handleClick() {
    if (!consent || loading) return;

    if (step === 0) {
      openSponsor(pickLink(0));
      setStep(1);
      return;
    }

    if (!tsToken) {
      setErr("Please complete the verification check above.");
      return;
    }

    openSponsor(pickLink(1));
    // Popunder triggered on user interaction, not on page load
    try {
      loadPopunder();
    } catch {}

    setLoading(true);
    setErr("");
    try {
      const res = await fetch("/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, turnstileToken: tsToken }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setLoading(false);
        setErr(data.error ?? "Verification failed. Please try again.");
        // The token has now been spent server-side. Without this reset the next
        // tap would resubmit the same consumed token and fail forever with
        // timeout-or-duplicate, permanently bricking the page.
        resetCaptcha();
        return;
      }

      if (typeof data.token !== "string" || !data.token) {
        setLoading(false);
        setErr("Could not get your link. Please try again.");
        resetCaptcha();
        return;
      }

      window.location.href = `/api/r/${code}?token=${encodeURIComponent(data.token)}`;
    } catch {
      setLoading(false);
      setErr("Network error. Please check your connection and try again.");
      resetCaptcha();
    }
  }

  const countdownDone = seconds <= 0;
  const canFinish = countdownDone && Boolean(tsToken) && !loading;

  // Avoid a flash of the consent gate before localStorage has been read.
  if (!consentLoaded)
    return (
      <div className="flex flex-col gap-3 animate-pulse" aria-hidden>
        <div className="h-6 bg-neutral-800 rounded w-1/2 mx-auto" />
        <div className="h-24 bg-neutral-800 rounded" />
        <div className="h-10 bg-neutral-800 rounded" />
      </div>
    );

  if (!consent) {
    return (
      <div className="flex flex-col gap-4 rounded-lg border border-neutral-800 bg-neutral-900/50 p-5 animate-slideUp shadow-[0_8px_32px_-12px_rgba(0,0,0,0.6)] card-lift">
        <h1 className="text-lg font-semibold">Before you continue</h1>
        <p className="text-sm leading-relaxed text-neutral-400">
          This link is unlocked by advertising. To continue you must accept our
          terms.
        </p>
        <ul className="list-disc space-y-1.5 pl-5 text-sm text-neutral-400 marker:text-neutral-600">
          <li>
            You will see advertisements, and a sponsor page will open in a new
            tab when you tap a sponsor button.
          </li>
          <li>
            Advertising partners and our bot check will process data about your
            device.
          </li>
          <li>
            Destinations and adverts are third-party. We do not host, control or
            endorse them, and{" "}
            <strong className="text-neutral-300">
              the owner is not responsible or liable for anything that happens
            </strong>{" "}
            as a result. You proceed entirely at your own risk.
          </li>
        </ul>
        <p className="text-xs leading-relaxed text-neutral-500">
          By tapping Accept &amp; Continue you confirm you have read and agree to
          our{" "}
          <Link href="/terms" className="underline hover:text-neutral-300">
            Terms of Service
          </Link>
          ,{" "}
          <Link href="/privacy" className="underline hover:text-neutral-300">
            Privacy Policy
          </Link>{" "}
          and{" "}
          <Link href="/disclaimer" className="underline hover:text-neutral-300">
            Disclaimer
          </Link>
          , and that you are old enough to use this site.
        </p>
        <button
          onClick={acceptConsent}
          className="w-full rounded bg-white px-6 py-2.5 font-medium text-black transition-all duration-200 hover:bg-neutral-100 hover:shadow-lg hover:scale-[1.015] active:scale-[0.985] shimmer-btn"
        >
          Accept &amp; Continue
        </button>
        <Link
          href="/"
          className="text-center text-xs text-neutral-500 underline hover:text-neutral-300"
        >
          Decline and leave
        </Link>
      </div>
    );
  }

  // Gate the flow when the ads cannot load. Reached either because an ad script
  // actually failed (blocker, DNS blocklist, or the network refusing a VPN or
  // datacenter IP with a 403) or because both pre-emptive probes agreed. The
  // visitor can always re-check, so a rare false positive costs a tap rather
  // than the whole redirect.
  if (adblock === "blocked") {
    return (
      <div className="flex flex-col gap-4 rounded-lg border border-amber-900/50 bg-amber-950/20 p-5 text-center animate-slideUp">
        <h1 className="text-lg font-semibold text-amber-300">
          Please disable your VPN or ad blocker
        </h1>
        <p className="text-sm leading-relaxed text-neutral-400">
          The adverts on this page could not load, and they are what pays for
          this link. Turn off whatever is blocking them, then re-check.
        </p>
        <ul className="mx-auto list-disc space-y-1.5 pl-5 text-left text-sm text-neutral-400 marker:text-neutral-600">
          <li>
            <strong className="text-neutral-300">Disconnect your VPN</strong> or
            proxy — advert providers reject VPN connections
          </li>
          <li>Pause your ad blocker (uBlock, AdBlock, Adguard) for this site</li>
          <li>Turn off Brave Shields or your browser&rsquo;s built-in blocker</li>
          <li>Switch off ad-blocking DNS (Pi-hole, NextDNS, AdGuard DNS)</li>
          <li>Disable privacy extensions for this page</li>
        </ul>
        {/* Full reload, not a state reset: the failed-unit record is module
            level so it survives a remount, and the ad scripts have to be
            requested again from scratch to get a different answer. */}
        <button
          onClick={() => location.reload()}
          className="w-full rounded bg-white px-6 py-2.5 font-medium text-black transition-all duration-200 hover:bg-neutral-100 hover:shadow-lg hover:scale-[1.015] active:scale-[0.985] shimmer-btn"
        >
          I&rsquo;ve disabled it — re-check
        </button>
        <p className="text-xs text-neutral-600">
          Your countdown is saved, so you won&rsquo;t have to wait again.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-5 animate-fadeIn">
        {/* Social bar + popunder — loaded once on main domain after consent */}
        <SocialBar />
        <Popunder />
        <div className="text-center animate-slideUp">
          <h1 className="text-lg font-semibold tracking-tight">Your link is almost ready</h1>
          <p className="mt-1 text-sm text-neutral-500">
            {step === 0
              ? "Step 1 of 2 — visit our sponsor to unlock."
              : "Step 2 of 2 — verify you're human, then finish."}
          </p>
          {/* Step dots */}
          <div className="mt-3 flex items-center justify-center gap-2">
            <span className={`h-1.5 rounded-full transition-all duration-500 ${step >= 0 ? "w-8 bg-white" : "w-6 bg-neutral-700"}`} />
            <span className={`h-1.5 rounded-full transition-all duration-500 ${step >= 1 ? "w-8 bg-white" : "w-6 bg-neutral-700"}`} />
          </div>
        </div>

        {/* Visible instruction — requested: click and open sponsor link, wait 5 sec and come back */}
        <div className="w-full rounded-lg border border-amber-900/40 bg-amber-950/20 px-4 py-3 text-center animate-slideUp-delay glow-amber card-lift">
          <p className="text-sm font-medium text-amber-300">
            {step === 0 ? "→ Click “Open Sponsor & Continue (1 of 2)” — sponsor opens in new tab" : "→ Complete the check, then click “Open Sponsor & Get My Link (2 of 2)”"}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-amber-200/70">
            Wait <span className="font-semibold text-amber-300">5 seconds</span> on the sponsor page, then come back here and continue. Your countdown is saved.
          </p>
        </div>

        {/* Primary native banner — high viewability during countdown */}
        <AdUnit
          variant="native"
          adKey="6e6cc333f8d31100c0f630699c8b02cc"
          scriptSrc="https://pl30646646.effectivecpmnetwork.com/6e6cc333f8d31100c0f630699c8b02cc/invoke.js"
          width={336}
          height={280}
          className="w-full"
        />

        {!countdownDone && (
          <div className="flex flex-col items-center gap-3 w-full max-w-[280px]">
            {/* Circular countdown — more premium than plain number */}
            <div className="relative flex h-24 w-24 items-center justify-center">
              <svg className="absolute inset-0 h-24 w-24 -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="42" fill="none" stroke="rgb(38 38 38)" strokeWidth="6" />
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  fill="none"
                  stroke="white"
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={263.89}
                  strokeDashoffset={263.89 * (1 - seconds / COUNTDOWN_SECONDS)}
                  className="transition-all duration-300 ease-linear"
                  style={{ filter: "drop-shadow(0 0 6px rgba(255,255,255,0.25))" }}
                />
              </svg>
              <p key={seconds} className="relative font-mono text-3xl font-semibold tabular-nums animate-tick">
                {seconds}
              </p>
            </div>
            <p className="text-xs text-neutral-500">
              Please wait{seconds === 1 ? " 1 second" : ` ${seconds} seconds`}
            </p>
            {/* Linear fallback bar */}
            <div className="h-1 w-full overflow-hidden rounded-full bg-neutral-800">
              <div
                className="h-full rounded-full bg-white transition-all duration-300 ease-linear"
                style={{ width: `${(seconds / COUNTDOWN_SECONDS) * 100}%` }}
              />
            </div>
          </div>
        )}

        {countdownDone && step > 0 && (
          <div className="flex w-full flex-col items-center gap-2 animate-fadeIn">
            <div ref={widgetHost} className="min-h-[65px] transition-all duration-300" />
            {tsFailed && (
              <div className="text-center text-xs leading-relaxed text-amber-400 animate-fadeIn">
                <p>The verification check could not load.</p>
                <p className="mt-1 text-neutral-500">
                  An ad blocker, VPN or network filter may be blocking it. Disable
                  it for this page and{" "}
                  <button
                    onClick={() => location.reload()}
                    className="underline hover:text-neutral-300"
                  >
                    reload
                  </button>
                  .
                </p>
              </div>
            )}
          </div>
        )}

        {/* Second banner — new 300x250 on main domain (queued to avoid atOptions race) */}
        <AdUnit
          variant="banner"
          adKey="6e855ffe8642d5f59d1f63f665190696"
          scriptSrc="https://www.highrevenueformat.com/6e855ffe8642d5f59d1f63f665190696/invoke.js"
          width={300}
          height={250}
          className="w-full"
        />

        {/* The label always states what the tap will do. The old button said
            "Continue" but silently opened an ad and required a second press —
            a labelled button that doesn't do what it says is the kind of thing
            networks classify as deceptive. */}
        <button
          onClick={handleClick}
          disabled={step === 0 ? !countdownDone : !canFinish}
          className="w-full rounded bg-white px-6 py-3 font-medium text-black transition-all duration-200 hover:shadow-xl hover:scale-[1.015] active:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100 disabled:hover:shadow-none shimmer-btn"
        >
          {step === 0
            ? countdownDone
              ? "Open Sponsor & Continue (1 of 2)"
              : `Please wait ${seconds}s`
            : loading
              ? "Unlocking…"
              : "Open Sponsor & Get My Link (2 of 2)"}
        </button>

        {step === 1 && !loading && (
          <p className="text-center text-xs text-neutral-500 animate-fadeIn">
            Sponsor page didn&rsquo;t open?{" "}
            <a
              href={SMART_LINKS[0]}
              target="_blank"
              rel="noopener"
              className="underline hover:text-neutral-300 transition-colors"
            >
              Open it here
            </a>{" "}
            — then tap the button above. Wait 5 sec on sponsor, then come back.
          </p>
        )}

        {err && (
          <p className="text-center text-sm text-red-400 animate-fadeIn" role="alert">
            {err}
          </p>
        )}

        {/* Banner below the fold-line: a second impression per visit. */}
        <AdUnit
          variant="banner"
          adKey="b00444c5eda4e8aa8c625ec8d2c44342"
          scriptSrc="https://www.highperformanceformat.com/b00444c5eda4e8aa8c625ec8d2c44342/invoke.js"
          width={300}
          height={250}
          className="w-full"
        />

        <p className="max-w-sm text-center text-[11px] leading-relaxed text-neutral-600">
          Sponsor pages open in a new tab and are provided by third parties. We
          are not responsible for their content — see our{" "}
          <Link href="/disclaimer" className="underline hover:text-neutral-400">
            Disclaimer
          </Link>
          .
        </p>
      </div>
  );
}
