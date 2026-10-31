import { requireUser } from "@/lib/auth";
import { q } from "@/lib/db";
import { Ring, ReportChip, MarkersTable, kindLabel, fmtDate, StatusChip } from "../ui";

export default async function Dashboard() {
  const u = await requireUser(["member"]);
  const { rows: reports } = await q("SELECT * FROM reports WHERE user_id=$1 ORDER BY created_at DESC", [u.id]);
  const latest = reports[0];
  const labs = reports.find((r) => r.kind === "labs");
  const inbody = reports.find((r) => r.kind === "inbody");
  const prev = reports.find((r, i) => i > 0 && latest && r.kind === latest.kind);
  const delta = latest && prev ? latest.mada - prev.mada : null;
  const lastNote = reports.find((r) => r.doctor_note);
  const focus = labs ? labs.markers.filter((m) => m.status === "att" || m.status === "doc") : [];

  if (!latest) {
    return (
      <div className="card empty">
        <h2>أهلاً {u.name}</h2>
        <p>لا يوجد أي تقرير بعد. ارفع أول فحص لتحصل على مؤشر مدى.</p>
        <a className="btn primary" href="/app/upload">ارفع فحصاً</a>
      </div>
    );
  }

  return (
    <>
      <div className="row between">
        <div className="stack" style={{ gap: 2 }}>
          <span className="muted small">أهلاً،</span>
          <h1>{u.name}</h1>
        </div>
        <a className="btn primary" href="/app/upload">ارفع فحصاً جديداً</a>
      </div>

      <div className="two">
        <div className="card hero-card">
          <Ring value={latest.mada} />
          <div className="stack" style={{ gap: 10, flex: 1, minWidth: 220 }}>
            <h2>مؤشر مدى</h2>
            <p className="muted">رقم واحد من 0 إلى 100 يلخص فحوصاتك الأخيرة. كلما ارتفع، كانت مؤشراتك أقرب للمثالي.</p>
            {delta !== null && (
              <span className={"chip " + (delta >= 0 ? "ok" : "warn")}>
                <span className="latin">{delta >= 0 ? "+" + delta : delta}</span> مقارنة بالتقرير السابق
              </span>
            )}
          </div>
        </div>
        <div className="grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
          <div className="stat"><span className="l">عمرك الحقيقي</span><span className="v">{u.age ?? "-"}</span></div>
          <div className="stat accent"><span className="l">عمرك الصحي التقديري</span><span className="v">{latest.bio_age}</span></div>
          <div className="stat"><span className="l">عدد التقارير</span><span className="v">{reports.length}</span></div>
          <div className="stat"><span className="l">آخر فحص</span><span className="v" style={{ fontSize: "1.1rem", paddingTop: 10 }}>{fmtDate(latest.created_at)}</span></div>
        </div>
      </div>

      {lastNote && (
        <div className="card" style={{ borderColor: "var(--accent)" }}>
          <div className="row between">
            <h3>ملاحظة الطبيب</h3>
            <span className="muted small">{fmtDate(lastNote.reviewed_at)}</span>
          </div>
          <p>{lastNote.doctor_note}</p>
        </div>
      )}

      {focus.length > 0 && (
        <div className="card">
          <h3>ركّز على هذه المؤشرات</h3>
          <div className="grid">
            {focus.map((m) => (
              <div key={m.key} className="card tight">
                <div className="row between"><strong>{m.name}</strong><StatusChip s={m.status} /></div>
                <p className="muted small">{m.note}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {labs && (
        <section className="stack">
          <div className="row between"><h2>آخر تحليل دم</h2><a href={"/app/report/" + labs.id} className="small">التفاصيل</a></div>
          <MarkersTable markers={labs.markers} />
        </section>
      )}

      {inbody && (
        <section className="stack">
          <div className="row between"><h2>آخر تقرير تكوين جسم</h2><a href={"/app/report/" + inbody.id} className="small">التفاصيل</a></div>
          <MarkersTable markers={inbody.markers} />
        </section>
      )}

      <section className="stack">
        <h2>كل التقارير</h2>
        <div className="tablewrap">
          <table>
            <thead><tr><th>التاريخ</th><th>النوع</th><th>مدى</th><th>الحالة</th><th></th></tr></thead>
            <tbody>
              {reports.map((r) => (
                <tr key={r.id}>
                  <td>{fmtDate(r.created_at)}</td>
                  <td>{kindLabel(r.kind)}</td>
                  <td className="num">{r.mada}</td>
                  <td><ReportChip s={r.status} /></td>
                  <td><a href={"/app/report/" + r.id}>فتح</a></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
