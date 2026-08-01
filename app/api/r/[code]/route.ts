import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/supabase";
import { verify } from "@/lib/token";
import { rateLimit } from "@/lib/ratelimit";

export async function GET(req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const token = req.nextUrl.searchParams.get("token") ?? "";
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";

  if (!rateLimit(`redirect:${ip}`, 30, 60_000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }
  if (!verify(token, code)) {
    return NextResponse.json({ error: "Invalid or expired token" }, { status: 403 });
  }

  const { data } = await db.from("links").select("id, destination_url, enabled, views").eq("short_code", code).single();
  if (!data || !data.enabled) {
    return NextResponse.json({ error: "Link not found" }, { status: 404 });
  }

  await db.from("links").update({ views: data.views + 1 }).eq("id", data.id);

  return NextResponse.redirect(data.destination_url, { status: 302 });
}
