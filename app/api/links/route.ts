import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/session";
import { db } from "@/lib/supabase";

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { data, error } = await db
    .from("links")
    .select("id, short_code, destination_url, views, enabled, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    console.error("[links] list error", error.message);
    return NextResponse.json({ error: "Failed to load" }, { status: 500 });
  }
  return NextResponse.json({ links: data ?? [] });
}
