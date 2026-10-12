// TODO: schedule cleanup_old_login_attempts via cron or scheduled function.
// The SQL function exists (supabase.sql), but nothing invokes it yet.
// This is a placeholder route so it can be POSTed to manually.
import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/session";
import { db } from "@/lib/supabase";

export async function POST() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { error } = await db.rpc("cleanup_old_login_attempts");
  if (error) {
    console.error("[login-attempts-cleanup] error", error.message);
    return NextResponse.json({ error: "Failed to cleanup" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}