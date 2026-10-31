import { requireUser } from "@/lib/auth";
import { q } from "@/lib/db";
import { createTicket } from "../../actions";
import { TicketChip, fmtDate } from "../../ui";

export default async function Support() {
  const u = await requireUser(["member"]);
  const { rows } = await q("SELECT * FROM tickets WHERE user_id=$1 ORDER BY updated_at DESC", [u.id]);
  return (
    <>
      <h1>الدعم</h1>
      <div className="two">
        <div className="stack">
          <h2>رسائلي</h2>
          {rows.length === 0 ? <div className="card empty">لا توجد رسائل بعد.</div> : (
            <div className="tablewrap">
              <table>
                <thead><tr><th>الموضوع</th><th>الحالة</th><th>آخر تحديث</th></tr></thead>
                <tbody>
                  {rows.map((t) => (
                    <tr key={t.id}>
                      <td><a href={"/app/support/" + t.id}>{t.subject}</a></td>
                      <td><TicketChip s={t.status} /></td>
                      <td>{fmtDate(t.updated_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <form action={createTicket} className="card form">
          <h2>رسالة جديدة</h2>
          <label>الموضوع<input name="subject" required maxLength={200} /></label>
          <label>الرسالة<textarea name="body" required maxLength={4000} /></label>
          <p className="muted small">فريق الدعم لا يرى نتائج فحوصاتك. لا تكتب أي معلومة صحية هنا.</p>
          <button className="btn primary">إرسال</button>
        </form>
      </div>
    </>
  );
}
