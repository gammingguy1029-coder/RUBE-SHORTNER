import Link from "next/link";

export const metadata = {
  title: "Rube Ads Shortener",
  description:
    "Rube Ads Shortener — an advertising-supported link redirection service. Currently in private testing.",
};

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center gap-6 p-6 text-center">
      <h1 className="text-3xl font-semibold">Welcome to Rube Ads Shortener</h1>

      <div className="w-full rounded-lg border border-amber-900/50 bg-amber-950/20 p-5">
        <p className="text-sm font-medium text-amber-300">
          This website is not public yet
        </p>
        <p className="mt-2 text-sm leading-relaxed text-neutral-400">
          We&rsquo;re still building and testing. Public sign-ups aren&rsquo;t
          open — please check back soon.
        </p>
      </div>

      <p className="max-w-md text-sm leading-relaxed text-neutral-400">
        Rube Ads Shortener turns long URLs into short links. Visitors pass
        through a short advertising step before being forwarded on, which is
        what keeps the service free.
      </p>

      <p className="max-w-md text-xs leading-relaxed text-neutral-600">
        Destinations and advertisements are provided by third parties. We do not
        host, control or endorse them and accept no responsibility for them —
        see our{" "}
        <Link href="/disclaimer" className="underline hover:text-neutral-400">
          Disclaimer
        </Link>
        .
      </p>

      <Link
        href="/contact"
        className="rounded border border-neutral-700 px-5 py-2 text-sm font-medium transition hover:bg-neutral-900"
      >
        Contact us
      </Link>
    </main>
  );
}
