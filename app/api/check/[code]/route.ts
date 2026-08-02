import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/supabase";
import { rateLimit } from "@/lib/ratelimit";
import { clientIp } from "@/lib/clientIp";

export async function GET(req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  if (!/^[A-Za-z0-9]{6,12}$/.test(code)) {
    return NextResponse.json({ exists: false }, { status: 404 });
  }

  // Unauthenticated existence oracle. Without a limit this route can be walked
  // to enumerate every live short code, which exposes the whole link list and
  // lets someone farm destinations without ever loading an ad.
  if (!rateLimit(`check:${clientIp(req)}`, 30, 60_000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  // .maybeSingle(): "no such code" is the expected case here, not an error.
  const { data } = await db
    .from("links")
    .select("enabled")
    .eq("short_code", code)
    .maybeSingle();
  if (!data) return NextResponse.json({ exists: false }, { status: 404 });
  return NextResponse.json({ exists: true, enabled: data.enabled });
}
