import { requireUser } from "@/lib/auth";
import { q } from "@/lib/db";
import { deleteWaitlist } from "../../actions";
import { fmtDate } from "../../ui";

const TYPE = { individual: "فرد", clinic: "عيادة أو مختبر", company: "شركة", club: "نادٍ", women: "برنامج أمد لها", investor: "مستثمر" };

export default async function Waitlist() {
  await requireUser(["admin"]);
  const { rows } = await q("SELECT * FROM waitlist ORDER BY created_at DESC");
  const byType = rows.reduce((a, r) => ((a[r.type] = (a[r.type] || 0) + 1), a), {});
  return (
    <>
      <div className="row between">
        <h1>قائمة الانتظار</h1>
        <a className="btn small" href="/admin/waitlist/export">تنزيل CSV</a>
      </div>
      <p className="muted">كل من سجّل من نموذج "سجّل مبكراً" في الموقع يظهر هنا مباشرة.</p>
      <div className="grid">
        <div className="stat accent"><span className="l">المجموع</span><span className="v">{rows.length}</span></div>
        {Object.entries(byType).map(([k, n]) => (
          <div key={k} className="stat"><span className="l">{TYPE[k] || k}</span><span className="v">{n}</span></div>
        ))}
      </div>
      <div className="tablewrap">
        <table>
          <thead><tr><th>الاسم</th><th>البريد</th><th>الجوال</th><th>النوع</th><th>المدينة</th><th>التاريخ</th><th></th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>{r.name}</td>
                <td className="latin small" dir="ltr" style={{ textAlign: "right" }}>{r.email || "-"}</td>
                <td className="latin small" dir="ltr" style={{ textAlign: "right" }}>{r.phone || "-"}</td>
                <td>{TYPE[r.type] || r.type || "-"}</td>
                <td>{r.city || "-"}</td>
                <td className="small">{fmtDate(r.created_at)}</td>
                <td>
                  <form action={deleteWaitlist}><input type="hidden" name="id" value={r.id} /><button className="btn small ghost danger">حذف</button></form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <div className="empty">لا تسجيلات بعد.</div>}
      </div>
    </>
  );
}
