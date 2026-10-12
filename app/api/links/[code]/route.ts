import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/session";
import { db } from "@/lib/supabase";
import { CODE_RE } from "@/lib/shortCode";

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { code } = await params;
  if (!CODE_RE.test(code)) return NextResponse.json({ error: "Invalid code" }, { status: 400 });
  const { error } = await db.from("links").delete().eq("short_code", code);
  if (error) {
    console.error("[links] delete error", error.message);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { code } = await params;
  if (!CODE_RE.test(code)) return NextResponse.json({ error: "Invalid code" }, { status: 400 });
  const body = await req.json().catch(() => ({}));
  const enabled = Boolean(body.enabled);
  const { error } = await db.from("links").update({ enabled }).eq("short_code", code);
  if (error) {
    console.error("[links] toggle error", error.message);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
