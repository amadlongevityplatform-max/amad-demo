import { requireUser } from "@/lib/auth";
import { q } from "@/lib/db";
import { STATUS } from "@/lib/demo";
import { ReportChip, kindLabel, fmtDate } from "../../ui";

export default async function Reviews({ searchParams }) {
  await requireUser(["admin", "doctor"]);
  const sp = await searchParams;
  const done = sp?.tab === "done";
  const { rows } = await q(
    `SELECT r.*, m.name, m.age, d.name AS doctor_name FROM reports r JOIN users m ON m.id=r.user_id LEFT JOIN users d ON d.id=r.doctor_id
     WHERE r.status=$1 ORDER BY ${done ? "r.reviewed_at DESC" : "r.created_at ASC"} LIMIT 100`,
    [done ? "reviewed" : "needs_review"]
  );
  return (
    <>
      <h1>مراجعات الطبيب</h1>
      <p className="muted">كل تقرير فيه نتيجة خارج النطاق يُحوَّل تلقائياً هنا قبل أن تصل أي توصية للعضو.</p>
      <div className="row">
        <a className={"btn small " + (!done ? "primary" : "")} href="/admin/reviews">بانتظار المراجعة</a>
        <a className={"btn small " + (done ? "primary" : "")} href="/admin/reviews?tab=done">تمت مراجعتها</a>
      </div>
      <div className="tablewrap">
        <table>
          <thead>
            <tr><th>العضو</th><th>العمر</th><th>النوع</th><th>التاريخ</th><th>نتائج تحتاج طبيب</th><th>الحالة</th>{done && <th>الطبيب</th>}<th></th></tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const flags = r.markers.filter((m) => m.status === "doc");
              return (
                <tr key={r.id}>
                  <td>{r.name}</td>
                  <td className="num">{r.age ?? "-"}</td>
                  <td>{kindLabel(r.kind)}</td>
                  <td className="small">{fmtDate(r.created_at)}</td>
                  <td className="small">{flags.map((f) => f.name).join("، ") || "-"}</td>
                  <td><ReportChip s={r.status} /></td>
                  {done && <td className="small">{r.doctor_name}</td>}
                  <td><a href={"/admin/reviews/" + r.id}>{done ? "عرض" : "مراجعة"}</a></td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {rows.length === 0 && <div className="empty">{done ? "لا مراجعات بعد." : "لا تقارير بانتظار المراجعة."}</div>}
      </div>
    </>
  );
}
