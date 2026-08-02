"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import AdFrame from "@/app/components/AdFrame";
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

/** Smart links opened by the two explicitly labelled sponsor buttons. */
const SMART_LINK_1 =
  "https://www.effectivecpmnetwork.com/sm5xqczp?key=40edaf85ab1f07358dcb031a21ee4ce1";
const SMART_LINK_2 =
  "https://www.effectivecpmnetwork.com/w3194snfs?key=28b8efa0c33161aee110d378e2a5c52a";

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
     resumes where it left off but a genuinely new visit starts fresh. */
  useEffect(() => {
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
  }, [code]);

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
  async function handleClick() {
    if (!consent || loading) return;

    if (step === 0) {
      openSponsor(SMART_LINK_1);
      setStep(1);
      return;
    }

    if (!tsToken) {
      setErr("Please complete the verification check above.");
      return;
    }

    openSponsor(SMART_LINK_2);

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
  if (!consentLoaded) return <div className="h-40" aria-hidden />;

  if (!consent) {
    return (
      <div className="flex flex-col gap-4 rounded-lg border border-neutral-800 bg-neutral-900/50 p-5">
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
          className="w-full rounded bg-white px-6 py-2.5 font-medium text-black transition hover:bg-neutral-200"
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

  // Gate the flow while a blocker is detected. Both probes had to agree to get
  // here, and the visitor can always re-check — nothing is permanent, so a rare
  // false positive costs a tap rather than the whole redirect.
  if (adblock === "blocked") {
    return (
      <div className="flex flex-col gap-4 rounded-lg border border-amber-900/50 bg-amber-950/20 p-5 text-center">
        <h1 className="text-lg font-semibold text-amber-300">
          Ad blocker detected
        </h1>
        <p className="text-sm leading-relaxed text-neutral-400">
          This link is free because advertising pays for it. To continue, please
          turn off anything that blocks ads for this page, then re-check.
        </p>
        <ul className="mx-auto list-disc space-y-1.5 pl-5 text-left text-sm text-neutral-400 marker:text-neutral-600">
          <li>Pause your ad blocker (uBlock, AdBlock, Adguard) for this site</li>
          <li>Turn off Brave Shields or your browser&rsquo;s built-in blocker</li>
          <li>Disconnect any VPN or ad-blocking DNS (Pi-hole, NextDNS)</li>
          <li>Disable privacy extensions for this page</li>
        </ul>
        <button
          onClick={() => location.reload()}
          className="w-full rounded bg-white px-6 py-2.5 font-medium text-black transition hover:bg-neutral-200"
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
    <div className="flex flex-col items-center gap-5">
        <div className="text-center">
          <h1 className="text-lg font-semibold">Your link is almost ready</h1>
          <p className="mt-1 text-sm text-neutral-500">
            {step === 0
              ? "Step 1 of 2 — visit our sponsor to unlock."
              : "Step 2 of 2 — verify you're human, then finish."}
          </p>
        </div>

        {/* Native banner fills the countdown dead-time with earning inventory. */}
        <AdFrame
          unit="native-banner.html"
          width={336}
          height={280}
          title="Sponsored content"
          className="w-full"
        />

        {!countdownDone && (
          <div className="text-center">
            <p className="font-mono text-4xl tabular-nums">{seconds}</p>
            <p className="mt-1 text-xs text-neutral-500">
              Please wait{seconds === 1 ? " 1 second" : ` ${seconds} seconds`}
            </p>
          </div>
        )}

        {countdownDone && step > 0 && (
          <div className="flex w-full flex-col items-center gap-2">
            <div ref={widgetHost} className="min-h-[65px]" />
            {tsFailed && (
              <div className="text-center text-xs leading-relaxed text-amber-400">
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

        {/* The label always states what the tap will do. The old button said
            "Continue" but silently opened an ad and required a second press —
            a labelled button that doesn't do what it says is the kind of thing
            networks classify as deceptive. */}
        <button
          onClick={handleClick}
          disabled={step === 0 ? !countdownDone : !canFinish}
          className="w-full rounded bg-white px-6 py-3 font-medium text-black transition hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-40"
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
          <p className="text-center text-xs text-neutral-500">
            Sponsor page didn&rsquo;t open?{" "}
            <a
              href={SMART_LINK_1}
              target="_blank"
              rel="noopener"
              className="underline hover:text-neutral-300"
            >
              Open it here
            </a>{" "}
            — then tap the button above.
          </p>
        )}

        {err && (
          <p className="text-center text-sm text-red-400" role="alert">
            {err}
          </p>
        )}

        {/* Banner below the fold-line: a second impression per visit. */}
        <AdFrame
          unit="banner-300x250.html"
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
