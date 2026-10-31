import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { q, audit } from "./db";

const COOKIE = "amad_session";

export async function login(email, password) {
  const { rows } = await q("SELECT * FROM users WHERE lower(email)=lower($1)", [email.trim()]);
  const u = rows[0];
  if (!u || !u.active) return null;
  const ok = await bcrypt.compare(password, u.password_hash);
  if (!ok) return null;
  const token = randomBytes(32).toString("hex");
  await q("INSERT INTO sessions (token,user_id,expires_at) VALUES ($1,$2,now()+interval '7 days')", [token, u.id]);
  const jar = await cookies();
  jar.set(COOKIE, token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 7 * 86400 });
  await audit(u.id, "login", "تسجيل دخول");
  return u;
}

export async function logout() {
  const jar = await cookies();
  const t = jar.get(COOKIE)?.value;
  if (t) await q("DELETE FROM sessions WHERE token=$1", [t]);
  jar.delete(COOKIE);
}

export async function currentUser() {
  const jar = await cookies();
  const t = jar.get(COOKIE)?.value;
  if (!t) return null;
  const { rows } = await q(
    "SELECT u.* FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token=$1 AND s.expires_at>now() AND u.active",
    [t]
  );
  return rows[0] || null;
}

export async function requireUser(roles) {
  const u = await currentUser();
  if (!u) redirect("/login");
  if (roles && !roles.includes(u.role)) redirect(u.role === "member" ? "/app" : "/admin");
  return u;
}

export function homeFor(u) {
  return u.role === "member" ? "/app" : "/admin";
}
