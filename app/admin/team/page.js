import { requireUser } from "@/lib/auth";
import { q } from "@/lib/db";
import { toggleUser } from "../../actions";
import { RoleChip, fmtDate } from "../../ui";
import { NewUserForm, ResetForm } from "./forms";

const PERMS = [
  ["مدير", "كل شيء: الأعضاء، الملفات الصحية، المراجعات، التذاكر، قائمة الانتظار، الحسابات، سجل النشاط."],
  ["طبيب", "الملفات الصحية للأعضاء ومراجعة التقارير المحوّلة وكتابة الملاحظات. لا يرى التذاكر ولا قائمة الانتظار."],
  ["دعم", "بيانات التواصل والتذاكر فقط. لا يرى أي نتيجة فحص."],
  ["عضو", "لوحته الخاصة وتقاريره ورسائله فقط."],
];

export default async function Team() {
  const me = await requireUser(["admin"]);
  const { rows } = await q("SELECT * FROM users ORDER BY CASE role WHEN 'admin' THEN 0 WHEN 'doctor' THEN 1 WHEN 'support' THEN 2 ELSE 3 END, created_at");
  return (
    <>
      <h1>الحسابات والصلاحيات</h1>
      <div className="grid">
        {PERMS.map(([r, d]) => (
          <div key={r} className="card tight"><strong>{r}</strong><p className="muted small">{d}</p></div>
        ))}
      </div>
      <div className="two">
        <div className="tablewrap">
          <table>
            <thead><tr><th>الاسم</th><th>البريد</th><th>الصلاحية</th><th>منذ</th><th>الحالة</th><th></th></tr></thead>
            <tbody>
              {rows.map((u) => (
                <tr key={u.id}>
                  <td>{u.name}</td>
                  <td className="latin small" dir="ltr" style={{ textAlign: "right" }}>{u.email}</td>
                  <td><RoleChip r={u.role} /></td>
                  <td className="small">{fmtDate(u.created_at)}</td>
                  <td>{u.active ? <span className="chip ok">نشط</span> : <span className="chip">موقوف</span>}</td>
                  <td className="row" style={{ gap: 6, flexWrap: "nowrap" }}>
                    {u.id !== me.id && (
                      <form action={toggleUser}>
                        <input type="hidden" name="user" value={u.id} />
                        <button className={"btn small ghost " + (u.active ? "danger" : "")}>{u.active ? "إيقاف" : "تفعيل"}</button>
                      </form>
                    )}
                    <ResetForm id={u.id} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <NewUserForm />
      </div>
    </>
  );
}
