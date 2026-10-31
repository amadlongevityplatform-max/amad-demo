import { requireUser } from "@/lib/auth";
import { q } from "@/lib/db";
import { fmtDate } from "../../ui";

export default async function Members({ searchParams }) {
  const u = await requireUser(["admin", "doctor", "support"]);
  const sp = await searchParams;
  const term = String(sp?.q || "").trim();
  const health = u.role !== "support";
  const { rows } = await q(
    `SELECT m.*, x.mada, x.created_at AS last_report, (SELECT count(*)::int FROM reports r WHERE r.user_id=m.id) AS n
     FROM users m
     LEFT JOIN LATERAL (SELECT mada, created_at FROM reports r WHERE r.user_id=m.id ORDER BY created_at DESC LIMIT 1) x ON true
     WHERE m.role='member' AND ($1='' OR m.name ILIKE '%'||$1||'%' OR m.email ILIKE '%'||$1||'%')
     ORDER BY m.created_at DESC`,
    [term]
  );
  return (
    <>
      <div className="row between">
        <h1>الأعضاء</h1>
        <form className="row" style={{ gap: 8 }}>
          <input name="q" defaultValue={term} placeholder="ابحث بالاسم أو البريد" style={{ width: 240 }} />
          <button className="btn small">بحث</button>
        </form>
      </div>
      {!health && <div className="alert info">تظهر لك بيانات التواصل فقط. نتائج الفحوصات خارج صلاحية الدعم.</div>}
      <div className="tablewrap">
        <table>
          <thead>
            <tr>
              <th>الاسم</th><th>البريد</th><th>المدينة</th>
              {health ? <><th>العمر</th><th>مدى</th><th>التقارير</th><th>آخر فحص</th></> : <th>الجوال</th>}
              <th>الحالة</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((m) => (
              <tr key={m.id}>
                <td><a href={"/admin/members/" + m.id}>{m.name}</a></td>
                <td className="latin small" dir="ltr" style={{ textAlign: "right" }}>{m.email}</td>
                <td>{m.city || "-"}</td>
                {health ? (
                  <>
                    <td className="num">{m.age ?? "-"}</td>
                    <td className="num">{m.mada ?? "-"}</td>
                    <td className="num">{m.n}</td>
                    <td className="small">{fmtDate(m.last_report)}</td>
                  </>
                ) : <td className="latin small" dir="ltr" style={{ textAlign: "right" }}>{m.phone || "-"}</td>}
                <td>{m.active ? <span className="chip ok">نشط</span> : <span className="chip">موقوف</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <div className="empty">لا نتائج.</div>}
      </div>
    </>
  );
}
