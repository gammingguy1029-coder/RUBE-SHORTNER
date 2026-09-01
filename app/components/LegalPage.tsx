import Link from "next/link";
import { LAST_UPDATED } from "@/lib/site";

export default function LegalPage({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <main className="mx-auto max-w-2xl px-6 py-12 animate-fadeIn">
      <Link
        href="/"
        className="text-sm text-neutral-500 underline hover:text-neutral-300 transition-colors"
      >
        ← Home
      </Link>
      <h1 className="mt-4 text-2xl font-semibold tracking-tight animate-slideUp">{title}</h1>
      <p className="mt-1 text-xs text-neutral-500 animate-fadeIn" style={{ animationDelay: "0.08s" }}>
        Last updated: {LAST_UPDATED}
      </p>
      <div className="legal mt-8 flex flex-col gap-5 text-sm leading-relaxed text-neutral-300 animate-fadeIn" style={{ animationDelay: "0.14s" }}>
        {children}
      </div>
    </main>
  );
}

export function H2({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mt-3 text-base font-semibold text-neutral-100">{children}</h2>
  );
}

export function UL({ children }: { children: React.ReactNode }) {
  return (
    <ul className="list-disc space-y-1.5 pl-5 marker:text-neutral-600">
      {children}
    </ul>
  );
}
