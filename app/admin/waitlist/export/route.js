import { currentUser } from "@/lib/auth";
import { q, audit } from "@/lib/db";

const esc = (v) => '"' + String(v ?? "").replace(/"/g, '""') + '"';

export async function GET() {
  const u = await currentUser();
  if (!u || u.role !== "admin") return new Response("Forbidden", { status: 403 });
  const { rows } = await q("SELECT name,email,phone,type,city,lang,created_at FROM waitlist ORDER BY created_at DESC");
  const head = ["name", "email", "phone", "type", "city", "lang", "created_at"];
  const csv = "﻿" + [head.join(","), ...rows.map((r) => head.map((h) => esc(h === "created_at" ? r[h]?.toISOString() : r[h])).join(","))].join("\n");
  await audit(u.id, "waitlist_exported", "تنزيل قائمة الانتظار");
  return new Response(csv, {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="amad-waitlist.csv"' },
  });
}
