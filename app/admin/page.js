import { requireUser } from "@/lib/auth";
import { q } from "@/lib/db";
import { ROLE_LABEL } from "@/lib/demo";
import { fmtDateTime } from "../ui";

export default async function Overview() {
  const u = await requireUser(["admin", "doctor", "support"]);
  const s = (await q(`SELECT
    (SELECT count(*) FROM users WHERE role='member')::int AS members,
    (SELECT count(*) FROM users WHERE role='member' AND created_at > now()-interval '30 days')::int AS new_members,
    (SELECT count(*) FROM reports)::int AS reports,
    (SELECT count(*) FROM reports WHERE created_at > now()-interval '7 days')::int AS reports_week,
    (SELECT count(*) FROM reports WHERE status='needs_review')::int AS pending,
    (SELECT count(*) FROM reports WHERE status='reviewed')::int AS reviewed,
    (SELECT count(*) FROM tickets WHERE status='open')::int AS open_tickets,
    (SELECT count(*) FROM tickets)::int AS tickets,
    (SELECT count(*) FROM waitlist)::int AS waitlist,
    (SELECT round(avg(mada))::int FROM (SELECT DISTINCT ON (user_id) mada FROM reports ORDER BY user_id, created_at DESC) x) AS avg_mada
  `)).rows[0];

  const dist = (await q(`SELECT
    count(*) FILTER (WHERE mada >= 85)::int AS a,
    count(*) FILTER (WHERE mada >= 70 AND mada < 85)::int AS b,
    count(*) FILTER (WHERE mada < 70)::int AS c
    FROM (SELECT DISTINCT ON (user_id) mada FROM reports ORDER BY user_id, created_at DESC) x`)).rows[0];
  const tot = Math.max(1, dist.a + dist.b + dist.c);

  const cards = [];
  if (u.role !== "support") cards.push(["متوسط مؤشر مدى", s.avg_mada ?? "-", "آخر تقرير لكل عضو"]);
  cards.push(["الأعضاء", s.members, s.new_members + " جديد خلال 30 يوماً"]);
  if (u.role !== "support") {
    cards.push(["التقارير", s.reports, s.reports_week + " خلال آخر 7 أيام"]);
    cards.push(["بانتظار الطبيب", s.pending, s.reviewed + " تمت مراجعتها"]);
  }
  if (u.role !== "doctor") cards.push(["تذاكر مفتوحة", s.open_tickets, "من أصل " + s.tickets]);
  if (u.role === "admin") cards.push(["قائمة الانتظار", s.waitlist, "تسجيلات من الموقع"]);

  const activity = u.role === "admin"
    ? (await q("SELECT l.*, a.name, a.role FROM audit_log l LEFT JOIN users a ON a.id=l.actor_id ORDER BY l.created_at DESC LIMIT 8")).rows
    : [];

  return (
    <>
      <div className="stack" style={{ gap: 4 }}>
        <span className="muted small">أهلاً {u.name}</span>
        <h1>نظرة عامة</h1>
      </div>
      <div className="grid">
        {cards.map(([l, v, sub]) => (
          <div key={l} className="stat">
            <span className="l">{l}</span>
            <span className="v">{v}</span>
            <span className="muted small">{sub}</span>
          </div>
        ))}
      </div>

      {u.role !== "support" && (
        <div className="card">
          <h3>توزيع الأعضاء حسب مؤشر مدى</h3>
          {[["85 فأعلى", dist.a], ["70 إلى 84", dist.b], ["أقل من 70", dist.c]].map(([l, n]) => (
            <div key={l} className="stack" style={{ gap: 4 }}>
              <div className="row between small"><span>{l}</span><span className="latin">{n}</span></div>
              <div className="bar"><i style={{ width: (n / tot) * 100 + "%" }} /></div>
            </div>
          ))}
        </div>
      )}

      {u.role === "doctor" && s.pending > 0 && (
        <a className="card" href="/admin/reviews" style={{ textDecoration: "none", color: "inherit", borderColor: "var(--accent)" }}>
          <h3>لديك {s.pending} تقارير بانتظار مراجعتك</h3>
          <span className="muted small">افتح قائمة المراجعات</span>
        </a>
      )}
      {u.role === "support" && (
        <div className="alert info">صلاحية الدعم تشمل بيانات التواصل والتذاكر فقط، ولا تشمل نتائج الفحوصات.</div>
      )}

      {activity.length > 0 && (
        <section className="stack">
          <div className="row between"><h2>آخر النشاطات</h2><a href="/admin/activity" className="small">السجل الكامل</a></div>
          <div className="tablewrap">
            <table>
              <thead><tr><th>الوقت</th><th>المستخدم</th><th>العملية</th></tr></thead>
              <tbody>
                {activity.map((a) => (
                  <tr key={a.id}>
                    <td className="small">{fmtDateTime(a.created_at)}</td>
                    <td>{a.name || "النظام"} {a.role && <span className="muted small">({ROLE_LABEL[a.role]})</span>}</td>
                    <td>{a.detail}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </>
  );
}
