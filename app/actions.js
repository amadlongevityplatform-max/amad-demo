"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { q, audit } from "@/lib/db";
import { login, logout, requireUser, homeFor } from "@/lib/auth";
import { generateReport, bioAge } from "@/lib/demo";

const s = (fd, k) => String(fd.get(k) || "").trim();

export async function loginAction(_prev, fd) {
  const u = await login(s(fd, "email"), s(fd, "password"));
  if (!u) return { error: "البريد أو كلمة السر غير صحيحة." };
  redirect(homeFor(u));
}

export async function logoutAction() {
  await logout();
  redirect("/login");
}

/* ---------- member ---------- */

export async function createDemoReport(kind) {
  const u = await requireUser(["member"]);
  const k = kind === "inbody" ? "inbody" : "labs";
  const rep = generateReport(k, 0.2);
  const { rows } = await q(
    "INSERT INTO reports (user_id,kind,title,markers,mada,bio_age,status) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id",
    [u.id, rep.kind, rep.title, JSON.stringify(rep.markers), rep.mada, bioAge(u.age || 40, rep.mada), rep.status]
  );
  await audit(u.id, "report_created", "رفع تقرير تجريبي #" + rows[0].id);
  return rows[0].id;
}

export async function createTicket(fd) {
  const u = await requireUser(["member"]);
  const subject = s(fd, "subject"), body = s(fd, "body");
  if (!subject || !body) return;
  const { rows } = await q("INSERT INTO tickets (user_id,subject) VALUES ($1,$2) RETURNING id", [u.id, subject.slice(0, 200)]);
  await q("INSERT INTO ticket_messages (ticket_id,author_id,body) VALUES ($1,$2,$3)", [rows[0].id, u.id, body.slice(0, 4000)]);
  redirect("/app/support/" + rows[0].id);
}

export async function memberReply(fd) {
  const u = await requireUser(["member"]);
  const id = Number(fd.get("ticket")), body = s(fd, "body");
  const t = await q("SELECT id FROM tickets WHERE id=$1 AND user_id=$2", [id, u.id]);
  if (!t.rows[0] || !body) return;
  await q("INSERT INTO ticket_messages (ticket_id,author_id,body) VALUES ($1,$2,$3)", [id, u.id, body.slice(0, 4000)]);
  await q("UPDATE tickets SET status='open', updated_at=now() WHERE id=$1", [id]);
  revalidatePath("/app/support/" + id);
}

/* ---------- staff ---------- */

export async function submitReview(fd) {
  const u = await requireUser(["doctor", "admin"]);
  const id = Number(fd.get("report")), note = s(fd, "note");
  if (!note) return;
  await q("UPDATE reports SET status='reviewed', doctor_id=$1, doctor_note=$2, reviewed_at=now() WHERE id=$3", [u.id, note.slice(0, 4000), id]);
  await audit(u.id, "report_reviewed", "مراجعة التقرير #" + id);
  redirect("/admin/reviews");
}

export async function staffReply(fd) {
  const u = await requireUser(["support", "admin"]);
  const id = Number(fd.get("ticket")), body = s(fd, "body");
  if (!body) return;
  await q("INSERT INTO ticket_messages (ticket_id,author_id,body) VALUES ($1,$2,$3)", [id, u.id, body.slice(0, 4000)]);
  await q("UPDATE tickets SET status='answered', updated_at=now() WHERE id=$1", [id]);
  await audit(u.id, "ticket_reply", "رد على التذكرة #" + id);
  revalidatePath("/admin/tickets/" + id);
}

export async function closeTicket(fd) {
  const u = await requireUser(["support", "admin"]);
  const id = Number(fd.get("ticket"));
  await q("UPDATE tickets SET status='closed', updated_at=now() WHERE id=$1", [id]);
  await audit(u.id, "ticket_closed", "إغلاق التذكرة #" + id);
  revalidatePath("/admin/tickets/" + id);
}

export async function createUser(_prev, fd) {
  const u = await requireUser(["admin"]);
  const name = s(fd, "name"), email = s(fd, "email").toLowerCase(), role = s(fd, "role"), password = s(fd, "password");
  const age = Number(s(fd, "age")) || null, city = s(fd, "city") || null;
  if (!name || !email || !password) return { error: "الاسم والبريد وكلمة السر مطلوبة." };
  if (!["member", "admin", "doctor", "support"].includes(role)) return { error: "صلاحية غير صحيحة." };
  if (password.length < 8) return { error: "كلمة السر 8 أحرف على الأقل." };
  const exists = await q("SELECT 1 FROM users WHERE lower(email)=$1", [email]);
  if (exists.rows[0]) return { error: "هذا البريد مستخدم." };
  const hash = await bcrypt.hash(password, 10);
  await q("INSERT INTO users (email,name,role,password_hash,age,city) VALUES ($1,$2,$3,$4,$5,$6)", [email, name, role, hash, age, city]);
  await audit(u.id, "user_created", "إضافة حساب " + email + " بصلاحية " + role);
  revalidatePath("/admin/team");
  return { ok: "تمت إضافة الحساب." };
}

export async function toggleUser(fd) {
  const u = await requireUser(["admin"]);
  const id = Number(fd.get("user"));
  if (id === u.id) return;
  const { rows } = await q("UPDATE users SET active = NOT active WHERE id=$1 RETURNING email, active", [id]);
  if (!rows[0]) return;
  if (!rows[0].active) await q("DELETE FROM sessions WHERE user_id=$1", [id]);
  await audit(u.id, rows[0].active ? "user_enabled" : "user_disabled", (rows[0].active ? "تفعيل " : "إيقاف ") + rows[0].email);
  revalidatePath("/admin/team");
  revalidatePath("/admin/members");
}

export async function resetPassword(_prev, fd) {
  const u = await requireUser(["admin"]);
  const id = Number(fd.get("user")), password = s(fd, "password");
  if (password.length < 8) return { error: "كلمة السر 8 أحرف على الأقل." };
  const hash = await bcrypt.hash(password, 10);
  const { rows } = await q("UPDATE users SET password_hash=$1 WHERE id=$2 RETURNING email", [hash, id]);
  if (!rows[0]) return { error: "الحساب غير موجود." };
  await q("DELETE FROM sessions WHERE user_id=$1", [id]);
  await audit(u.id, "password_reset", "تغيير كلمة سر " + rows[0].email);
  return { ok: "تم تغيير كلمة السر." };
}

export async function deleteWaitlist(fd) {
  const u = await requireUser(["admin"]);
  const id = Number(fd.get("id"));
  await q("DELETE FROM waitlist WHERE id=$1", [id]);
  await audit(u.id, "waitlist_deleted", "حذف تسجيل من قائمة الانتظار #" + id);
  revalidatePath("/admin/waitlist");
}
