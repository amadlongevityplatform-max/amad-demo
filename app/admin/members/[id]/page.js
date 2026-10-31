import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { q, audit } from "@/lib/db";
import { Ring, ReportChip, TicketChip, MarkersTable, kindLabel, fmtDate } from "../../../ui";

export default async function Member({ params }) {
  const u = await requireUser(["admin", "doctor", "support"]);
  const { id } = await params;
  const m = (await q("SELECT * FROM users WHERE id=$1 AND role='member'", [Number(id)])).rows[0];
  if (!m) notFound();
  const health = u.role !== "support";
  const reports = health ? (await q("SELECT * FROM reports WHERE user_id=$1 ORDER BY created_at DESC", [m.id])).rows : [];
  const tickets = u.role !== "doctor" ? (await q("SELECT * FROM tickets WHERE user_id=$1 ORDER BY updated_at DESC", [m.id])).rows : [];
  if (health) await audit(u.id, "health_record_viewed", "عرض الملف الصحي لـ " + m.name);
  const latest = reports[0];

  return (
    <>
      <a href="/admin/members" className="small">كل الأعضاء</a>
      <div className="row between">
        <h1>{m.name}</h1>
        {m.active ? <span className="chip ok">نشط</span> : <span className="chip">موقوف</span>}
      </div>
      <div className="two">
        <div className="card">
          <h3>بيانات الحساب</h3>
          <div className="grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
            <div><span className="muted small">البريد</span><p className="latin" dir="ltr" style={{ textAlign: "right" }}>{m.email}</p></div>
            <div><span className="muted small">الجوال</span><p className="latin" dir="ltr" style={{ textAlign: "right" }}>{m.phone || "-"}</p></div>
            <div><span className="muted small">المدينة</span><p>{m.city || "-"}</p></div>
            <div><span className="muted small">عضو منذ</span><p>{fmtDate(m.created_at)}</p></div>
            {health && <div><span className="muted small">العمر</span><p className="latin">{m.age ?? "-"}</p></div>}
            {health && <div><span className="muted small">الجنس</span><p>{m.gender || "-"}</p></div>}
          </div>
        </div>
        {health && latest ? (
          <div className="card hero-card">
            <Ring value={latest.mada} size={140} />
            <div className="stack" style={{ gap: 4 }}>
              <span className="muted small">العمر الصحي التقديري</span>
              <strong className="latin" style={{ fontSize: "1.6rem", fontWeight: 300 }}>{latest.bio_age}</strong>
              <span className="muted small">آخر تقرير: {fmtDate(latest.created_at)}</span>
            </div>
          </div>
        ) : !health ? (
          <div className="card"><p className="muted">نتائج الفحوصات خارج صلاحية الدعم. يظهر هنا فقط ما يلزم للتواصل.</p></div>
        ) : null}
      </div>

      {health && (
        <section className="stack">
          <h2>التقارير</h2>
          {reports.length === 0 && <div className="card empty">لا تقارير.</div>}
          {reports.map((r) => (
            <details key={r.id} className="card" open={r === latest}>
              <summary className="row between" style={{ cursor: "pointer" }}>
                <span>{kindLabel(r.kind)} · {fmtDate(r.created_at)} · مدى <span className="latin">{r.mada}</span></span>
                <ReportChip s={r.status} />
              </summary>
              <MarkersTable markers={r.markers} />
              {r.doctor_note && <p className="alert info">ملاحظة الطبيب: {r.doctor_note}</p>}
              {r.status === "needs_review" && <a className="btn small primary" href={"/admin/reviews/" + r.id}>راجع هذا التقرير</a>}
            </details>
          ))}
        </section>
      )}

      {tickets.length > 0 && (
        <section className="stack">
          <h2>تذاكر الدعم</h2>
          <div className="tablewrap">
            <table>
              <thead><tr><th>الموضوع</th><th>الحالة</th><th>آخر تحديث</th></tr></thead>
              <tbody>
                {tickets.map((t) => (
                  <tr key={t.id}>
                    <td><a href={"/admin/tickets/" + t.id}>{t.subject}</a></td>
                    <td><TicketChip s={t.status} /></td>
                    <td>{fmtDate(t.updated_at)}</td>
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
