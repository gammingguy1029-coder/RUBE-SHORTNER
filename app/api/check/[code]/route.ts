import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/supabase";

export async function GET(req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  if (!/^[A-Za-z0-9]{6,12}$/.test(code)) {
    return NextResponse.json({ exists: false }, { status: 404 });
  }
  const { data } = await db.from("links").select("enabled").eq("short_code", code).single();
  if (!data) return NextResponse.json({ exists: false }, { status: 404 });
  return NextResponse.json({ exists: true, enabled: data.enabled });
}
