import { requireUser } from "@/lib/auth";
import { q } from "@/lib/db";
import { RoleChip, fmtDateTime } from "../../ui";

export default async function Activity() {
  await requireUser(["admin"]);
  const { rows } = await q("SELECT l.*, a.name, a.role FROM audit_log l LEFT JOIN users a ON a.id=l.actor_id ORDER BY l.created_at DESC LIMIT 300");
  return (
    <>
      <h1>سجل النشاط</h1>
      <p className="muted">كل دخول، وكل فتح لملف صحي، وكل مراجعة أو تعديل على الحسابات يُسجَّل هنا باسم من قام به ووقته.</p>
      <div className="tablewrap">
        <table>
          <thead><tr><th>الوقت</th><th>المستخدم</th><th>الصلاحية</th><th>العملية</th></tr></thead>
          <tbody>
            {rows.map((a) => (
              <tr key={a.id}>
                <td className="small">{fmtDateTime(a.created_at)}</td>
                <td>{a.name || "النظام"}</td>
                <td>{a.role ? <RoleChip r={a.role} /> : "-"}</td>
                <td>{a.detail}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
