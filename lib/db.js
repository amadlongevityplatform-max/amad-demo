import { Pool } from "pg";
import bcrypt from "bcryptjs";
import { generateReport, bioAge } from "./demo";

const g = globalThis;

function makePool() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  return new Pool({ connectionString: url, max: 5, idleTimeoutMillis: 10000 });
}

export function pool() {
  if (!g.__amadPool) g.__amadPool = makePool();
  return g.__amadPool;
}

export async function q(text, params = []) {
  await ready();
  return pool().query(text, params);
}

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('member','admin','doctor','support')),
  password_hash TEXT NOT NULL,
  age INT,
  gender TEXT,
  city TEXT,
  phone TEXT,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL
);
CREATE TABLE IF NOT EXISTS reports (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  title TEXT NOT NULL,
  markers JSONB NOT NULL,
  mada INT NOT NULL,
  bio_age NUMERIC(4,1),
  status TEXT NOT NULL,
  doctor_id INT REFERENCES users(id),
  doctor_note TEXT,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS tickets (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS ticket_messages (
  id SERIAL PRIMARY KEY,
  ticket_id INT NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  author_id INT NOT NULL REFERENCES users(id),
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS waitlist (
  id SERIAL PRIMARY KEY,
  name TEXT, email TEXT, phone TEXT, type TEXT, city TEXT, lang TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS audit_log (
  id SERIAL PRIMARY KEY,
  actor_id INT REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  detail TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
`;

export const DEMO_PASSWORD = process.env.DEMO_PASSWORD || "Amad-Demo-2026";

const STAFF = [
  { email: "admin@amad.demo", name: "مدير المنصة", role: "admin" },
  { email: "doctor@amad.demo", name: "د. سلمى الهاشمي", role: "doctor" },
  { email: "support@amad.demo", name: "فريق الدعم: يوسف", role: "support" },
];

const MEMBERS = [
  { email: "ahmed@amad.demo", name: "أحمد المنصوري", age: 42, gender: "ذكر", city: "دبي", bias: 0.3 },
  { email: "mariam@amad.demo", name: "مريم الكعبي", age: 51, gender: "أنثى", city: "الشارقة", bias: 0.2 },
  { email: "khalid@amad.demo", name: "خالد العامري", age: 36, gender: "ذكر", city: "أبوظبي", bias: 0 },
  { email: "noura@amad.demo", name: "نورة الشامسي", age: 47, gender: "أنثى", city: "دبي", bias: 0.15 },
  { email: "omar@amad.demo", name: "عمر حداد", age: 58, gender: "ذكر", city: "عجمان", bias: 0.4 },
  { email: "layla@amad.demo", name: "ليلى السويدي", age: 33, gender: "أنثى", city: "دبي", bias: -0.1 },
  { email: "saeed@amad.demo", name: "سعيد النعيمي", age: 61, gender: "ذكر", city: "رأس الخيمة", bias: 0.35 },
  { email: "huda@amad.demo", name: "هدى البلوشي", age: 44, gender: "أنثى", city: "الفجيرة", bias: 0.1 },
];

async function seed(client) {
  const hash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const ids = {};
  for (const s of STAFF) {
    const { rows } = await client.query(
      "INSERT INTO users (email,name,role,password_hash) VALUES ($1,$2,$3,$4) RETURNING id",
      [s.email, s.name, s.role, hash]
    );
    ids[s.role] = rows[0].id;
  }
  const day = 86400000;
  for (const [idx, m] of MEMBERS.entries()) {
    const joined = 14 + idx * 11;
    const { rows } = await client.query(
      "INSERT INTO users (email,name,role,password_hash,age,gender,city,phone,created_at) VALUES ($1,$2,'member',$3,$4,$5,$6,$7,$8) RETURNING id",
      [m.email, m.name, hash, m.age, m.gender, m.city, "+971 50 000 " + String(1000 + Math.floor(Math.random() * 8999)), new Date(Date.now() - joined * day)]
    );
    const uid = rows[0].id;
    // two older reports and one recent
    const plan = [
      { kind: "labs", ago: joined - 2, bias: m.bias + 0.05 },
      { kind: "inbody", ago: Math.round(joined * 0.6), bias: m.bias + 0.1 },
      { kind: "labs", ago: Math.min(5, joined - 6), bias: m.bias },
    ];
    for (const p of plan) {
      const rep = generateReport(p.kind, p.bias);
      let status = rep.status, doctorId = null, note = null, reviewedAt = null;
      if (status === "needs_review" && p.ago > 6) {
        status = "reviewed"; doctorId = ids.doctor; reviewedAt = new Date(Date.now() - (p.ago - 2) * day);
        note = "راجعت النتائج. أنصح بزيارة طبيب عام خلال أسبوعين لتقييم القيم المرتفعة، والاستمرار في خطة الأكل والمشي. لا حاجة لأي دواء قبل الزيارة.";
      }
      await client.query(
        "INSERT INTO reports (user_id,kind,title,markers,mada,bio_age,status,doctor_id,doctor_note,reviewed_at,created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)",
        [uid, rep.kind, rep.title, JSON.stringify(rep.markers), rep.mada, bioAge(m.age, rep.mada), status, doctorId, note, reviewedAt, new Date(Date.now() - p.ago * day)]
      );
    }
  }
  // sample tickets
  const tk = [
    { email: "mariam@amad.demo", subject: "لم أفهم نتيجة فيتامين د", msg: "النتيجة مكتوب عليها يحتاج انتباه، هل أحتاج مكملات؟", reply: null },
    { email: "omar@amad.demo", subject: "تغيير موعد سحب الدم", msg: "أريد تغيير الموعد إلى يوم السبت إن أمكن.", reply: "أهلاً عمر، تم تغيير الموعد إلى السبت الساعة 9 صباحاً في نفس المختبر." },
    { email: "khalid@amad.demo", subject: "طريقة رفع تقرير InBody", msg: "هل أرفع صورة أم ملف PDF؟", reply: null },
  ];
  for (const t of tk) {
    const u = await client.query("SELECT id FROM users WHERE email=$1", [t.email]);
    const uid = u.rows[0].id;
    const { rows } = await client.query(
      "INSERT INTO tickets (user_id,subject,status,created_at,updated_at) VALUES ($1,$2,$3,now()-interval '2 days',now()-interval '1 day') RETURNING id",
      [uid, t.subject, t.reply ? "answered" : "open"]
    );
    await client.query("INSERT INTO ticket_messages (ticket_id,author_id,body,created_at) VALUES ($1,$2,$3,now()-interval '2 days')", [rows[0].id, uid, t.msg]);
    if (t.reply) await client.query("INSERT INTO ticket_messages (ticket_id,author_id,body,created_at) VALUES ($1,$2,$3,now()-interval '1 day')", [rows[0].id, ids.support, t.reply]);
  }
  const wl = [
    ["عيادة النخبة (مثال)", "clinic@example.com", "", "clinic", "دبي"],
    ["شركة الأفق (مثال)", "hr@example.com", "", "company", "أبوظبي"],
    ["نادي الصحة (مثال)", "club@example.com", "", "club", "الشارقة"],
  ];
  for (const w of wl) await client.query("INSERT INTO waitlist (name,email,phone,type,city,lang) VALUES ($1,$2,$3,$4,$5,'ar')", w);
  await client.query("INSERT INTO audit_log (actor_id,action,detail) VALUES (NULL,'seed','تجهيز البيانات التجريبية')");
}

async function init() {
  const client = await pool().connect();
  try {
    await client.query("SELECT pg_advisory_lock(424242)");
    await client.query(SCHEMA);
    const { rows } = await client.query("SELECT count(*)::int AS n FROM users");
    if (rows[0].n === 0) {
      await client.query("BEGIN");
      try { await seed(client); await client.query("COMMIT"); }
      catch (e) { await client.query("ROLLBACK"); throw e; }
    }
  } finally {
    await client.query("SELECT pg_advisory_unlock(424242)").catch(() => {});
    client.release();
  }
}

export function ready() {
  if (!g.__amadReady) {
    g.__amadReady = init().catch((e) => { g.__amadReady = null; throw e; });
  }
  return g.__amadReady;
}

export async function audit(actorId, action, detail) {
  await q("INSERT INTO audit_log (actor_id,action,detail) VALUES ($1,$2,$3)", [actorId, action, detail]);
}
