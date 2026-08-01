import { db } from "@/lib/supabase";
import { notFound } from "next/navigation";
import Unlocker from "./Unlocker";

export default async function CodePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  if (!/^[A-Za-z0-9]{6,12}$/.test(code)) notFound();

  const { data } = await db.from("links").select("enabled").eq("short_code", code).single();
  if (!data || !data.enabled) notFound();

  return (
    <main className="max-w-md mx-auto p-6 flex flex-col gap-6 min-h-screen justify-center">
      <div className="bg-neutral-900 border border-neutral-800 rounded p-6 text-center text-sm text-neutral-400">
        Ad placeholder
      </div>
      <Unlocker code={code} />
    </main>
  );
}
