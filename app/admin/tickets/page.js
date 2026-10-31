import { requireUser } from "@/lib/auth";
import { q } from "@/lib/db";
import { TicketChip, fmtDate } from "../../ui";

const TABS = [["open", "مفتوحة"], ["answered", "تم الرد"], ["closed", "مغلقة"], ["all", "الكل"]];

export default async function Tickets({ searchParams }) {
  await requireUser(["admin", "support"]);
  const sp = await searchParams;
  const tab = TABS.some(([k]) => k === sp?.tab) ? sp.tab : "open";
  const { rows } = await q(
    `SELECT t.*, m.name, (SELECT count(*)::int FROM ticket_messages x WHERE x.ticket_id=t.id) AS n
     FROM tickets t JOIN users m ON m.id=t.user_id WHERE ($1='all' OR t.status=$1) ORDER BY t.updated_at DESC`,
    [tab]
  );
  return (
    <>
      <h1>تذاكر الدعم</h1>
      <div className="row">
        {TABS.map(([k, l]) => <a key={k} className={"btn small " + (tab === k ? "primary" : "")} href={"/admin/tickets?tab=" + k}>{l}</a>)}
      </div>
      <div className="tablewrap">
        <table>
          <thead><tr><th>الموضوع</th><th>العضو</th><th>الرسائل</th><th>الحالة</th><th>آخر تحديث</th></tr></thead>
          <tbody>
            {rows.map((t) => (
              <tr key={t.id}>
                <td><a href={"/admin/tickets/" + t.id}>{t.subject}</a></td>
                <td>{t.name}</td>
                <td className="num">{t.n}</td>
                <td><TicketChip s={t.status} /></td>
                <td className="small">{fmtDate(t.updated_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <div className="empty">لا تذاكر هنا.</div>}
      </div>
    </>
  );
}
