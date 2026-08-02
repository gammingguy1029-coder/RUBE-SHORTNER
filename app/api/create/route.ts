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
  // Unparseable JSON used to throw here and surface as a 500.
  const body = await req.json().catch(() => ({}));
  const url = (body as { url?: unknown })?.url;
  if (typeof url !== "string" || !validUrl(url)) {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  // .maybeSingle(), not .single(): .single() reports zero rows as an error, so a
  // free code and a genuine query failure both arrived as data === null and a
  // broken database looked like "this code is available".
  let code = "";
  let free = false;
  for (let i = 0; i < 5; i++) {
    const len = 8 + Math.floor(Math.random() * 3);
    const candidate = genCode(len);
    const { data, error } = await db
      .from("links")
      .select("id")
      .eq("short_code", candidate)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: "Failed to save" }, { status: 500 });
    }
    if (!data) {
      code = candidate;
      free = true;
      break;
    }
  }

  // Previously the loop fell through and inserted the last candidate even after
  // confirming it was taken, so five collisions became a unique-constraint
  // violation reported as a generic 500.
  if (!free) {
    return NextResponse.json(
      { error: "Could not allocate a code. Please try again." },
      { status: 503 }
    );
  }

  const { error } = await db.from("links").insert({ short_code: code, destination_url: url });
  if (error) return NextResponse.json({ error: "Failed to save" }, { status: 500 });

  return NextResponse.json({ code, url: `${process.env.NEXT_PUBLIC_BASE_URL}/${code}` });
}
