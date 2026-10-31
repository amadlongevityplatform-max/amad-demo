import { NextResponse } from "next/server";
import { q } from "@/lib/db";

const clip = (v, n = 200) => String(v || "").trim().slice(0, n);
const hits = new Map();

export async function POST(req) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "x";
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < 60000);
  if (recent.length >= 5) return NextResponse.json({ ok: false }, { status: 429 });
  hits.set(ip, [...recent, now]);

  let b;
  try { b = await req.json(); } catch { return NextResponse.json({ ok: false }, { status: 400 }); }
  const name = clip(b.name), email = clip(b.email), phone = clip(b.phone, 40);
  if (!name || (!email && !phone)) return NextResponse.json({ ok: false }, { status: 400 });
  await q("INSERT INTO waitlist (name,email,phone,type,city,lang) VALUES ($1,$2,$3,$4,$5,$6)", [
    name, email, phone, clip(b.type, 30), clip(b.city, 80), clip(b.lang, 4),
  ]);
  return NextResponse.json({ ok: true });
}
