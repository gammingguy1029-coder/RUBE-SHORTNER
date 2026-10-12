import { db } from "@/lib/supabase";
import { notFound } from "next/navigation";
import Unlocker from "./Unlocker";
import { CODE_RE } from "@/lib/shortCode";

// Individual short-link pages must stay out of search results. The site-wide
// noindex was removed from layout.tsx so the homepage and legal pages CAN be
// indexed (ad networks check for those during publisher review), so the
// directive is scoped to just this route instead.
export const metadata = { title: "Unlock link", robots: "noindex, nofollow" };

export default async function CodePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  if (!CODE_RE.test(code)) notFound();

  // .maybeSingle(): .single() reports zero rows as an error, so a missing code
  // and a database fault were indistinguishable here.
  const { data, error } = await db
    .from("links")
    .select("enabled")
    .eq("short_code", code)
    .maybeSingle();
  // Database fault must NOT surface as 404 — a real visitor loses their redirect,
  // and ad-network crawlers downgrade the domain's quality signal. Render an
  // explicit "temporarily unavailable" panel instead.
  if (error) {
    console.error("[code/page] db error", error.message);
    return (
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-4 p-6 text-center animate-slideUp">
        <h1 className="text-xl font-semibold">Temporarily unavailable</h1>
        <p className="text-sm leading-relaxed text-neutral-500">
          We couldn&rsquo;t reach the link store. Please try again in a moment.
        </p>
      </main>
    );
  }
  if (!data || !data.enabled) notFound();

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-6 p-6">
      <Unlocker code={code} />
    </main>
  );
}
