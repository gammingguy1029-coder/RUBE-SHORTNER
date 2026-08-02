import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/session";
import { db } from "@/lib/supabase";
import { randomBytes } from "crypto";

const CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";

function genCode(len: number): string {
  const bytes = randomBytes(len);
  return Array.from(bytes, (b) => CHARS[b % CHARS.length]).join("");
}

function validUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { url } = await req.json();
  if (typeof url !== "string" || !validUrl(url)) {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  let code = "";
  for (let i = 0; i < 5; i++) {
    const len = 8 + Math.floor(Math.random() * 3);
    code = genCode(len);
    const { data } = await db.from("links").select("id").eq("short_code", code).single();
    if (!data) break;
  }

  const { error } = await db.from("links").insert({ short_code: code, destination_url: url });
  if (error) return NextResponse.json({ error: "Failed to save" }, { status: 500 });

  return NextResponse.json({ code, url: `${process.env.NEXT_PUBLIC_BASE_URL}/${code}` });
}
