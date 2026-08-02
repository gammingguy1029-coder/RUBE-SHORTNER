import { db } from "@/lib/supabase";
import { notFound } from "next/navigation";
import Unlocker from "./Unlocker";

// Individual short-link pages must stay out of search results. The site-wide
// noindex was removed from layout.tsx so the homepage and legal pages CAN be
// indexed (ad networks check for those during publisher review), so the
// directive is scoped to just this route instead.
export const metadata = { title: "Unlock link", robots: "noindex, nofollow" };

export default async function CodePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  if (!/^[A-Za-z0-9]{6,12}$/.test(code)) notFound();

  const { data } = await db.from("links").select("enabled").eq("short_code", code).single();
  if (!data || !data.enabled) notFound();

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-6 p-6">
      <Unlocker code={code} />
    </main>
  );
}
