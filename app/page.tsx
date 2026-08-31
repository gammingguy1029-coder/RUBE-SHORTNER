import Link from "next/link";
import { SMART_LINKS } from "@/lib/smartLinks";

export const metadata = {
  title: "Rube Ads Shortener",
  description:
    "Rube Ads Shortener — an advertising-supported link redirection service. Currently in private testing.",
};

export default function Home() {
  return (
    <main className="relative mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center gap-6 p-6 text-center overflow-hidden">
      {/* Soft animated blobs behind */}
      <div className="pointer-events-none absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-amber-600/10 blur-[80px] animate-float" />
      <div className="pointer-events-none absolute -bottom-20 -right-20 h-64 w-64 rounded-full bg-neutral-700/20 blur-[60px] animate-float" style={{ animationDelay: "1.2s" }} />

      <h1 className="text-3xl font-semibold tracking-tight animate-slideUp">Welcome to Rube Ads Shortener</h1>

      <div className="w-full rounded-lg border border-amber-900/50 bg-amber-950/20 p-5 animate-slideUp-delay shadow-[0_8px_32px_-12px_rgba(251,146,60,0.15)] card-lift">
        <p className="text-sm font-medium text-amber-300">
          This website is not public yet
        </p>
        <p className="mt-2 text-sm leading-relaxed text-neutral-400">
          We&rsquo;re still building and testing. Public sign-ups aren&rsquo;t
          open — please check back soon.
        </p>
      </div>

      <p className="max-w-md text-sm leading-relaxed text-neutral-400 animate-fadeIn" style={{ animationDelay: "0.18s" }}>
        Rube Ads Shortener turns long URLs into short links. Visitors pass
        through a short advertising step before being forwarded on, which is
        what keeps the service free.
      </p>

      <p className="max-w-md text-xs leading-relaxed text-neutral-600 animate-fadeIn" style={{ animationDelay: "0.24s" }}>
        Destinations and advertisements are provided by third parties. We do not
        host, control or endorse them and accept no responsibility for them —
        see our{" "}
        <Link href="/disclaimer" className="underline hover:text-neutral-400 transition-colors">
          Disclaimer
        </Link>
        .
      </p>

      <a
        href={SMART_LINKS[2]}
        target="_blank"
        rel="noopener nofollow"
        className="text-xs text-neutral-500 underline hover:text-neutral-300 transition-colors animate-fadeIn"
        style={{ animationDelay: "0.3s" }}
      >
        Sponsored — Visit our partner
      </a>

      <Link
        href="/contact"
        className="rounded border border-neutral-700 px-5 py-2 text-sm font-medium transition-all duration-200 hover:bg-neutral-900 hover:border-neutral-600 hover:scale-[1.02] active:scale-[0.98] animate-fadeIn"
        style={{ animationDelay: "0.36s" }}
      >
        Contact us
      </Link>
    </main>
  );
}
