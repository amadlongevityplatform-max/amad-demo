import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { q } from "@/lib/db";
import { staffReply, closeTicket } from "../../../actions";
import { TicketChip, fmtDateTime, RoleChip } from "../../../ui";

export default async function Ticket({ params }) {
  await requireUser(["admin", "support"]);
  const { id } = await params;
  const t = (await q("SELECT t.*, m.name, m.email, m.id AS member_id FROM tickets t JOIN users m ON m.id=t.user_id WHERE t.id=$1", [Number(id)])).rows[0];
  if (!t) notFound();
  const { rows: msgs } = await q(
    "SELECT x.*, a.name, a.role FROM ticket_messages x JOIN users a ON a.id=x.author_id WHERE ticket_id=$1 ORDER BY created_at",
    [t.id]
  );
  return (
    <>
      <a href="/admin/tickets" className="small">كل التذاكر</a>
      <div className="row between">
        <div className="stack" style={{ gap: 2 }}>
          <h1>{t.subject}</h1>
          <a href={"/admin/members/" + t.member_id} className="small">{t.name}</a>
        </div>
        <TicketChip s={t.status} />
      </div>
      <div className="card stack">
        {msgs.map((m) => (
          <div key={m.id} className={"msg " + (m.role === "member" ? "them" : "mine")}>
            <span className="meta">{m.name} <RoleChip r={m.role} /> · {fmtDateTime(m.created_at)}</span>
            <p>{m.body}</p>
          </div>
        ))}
      </div>
      {t.status !== "closed" && (
        <div className="two">
          <form action={staffReply} className="card form">
            <input type="hidden" name="ticket" value={t.id} />
            <label>ردّ على العضو<textarea name="body" required maxLength={4000} /></label>
            <button className="btn primary">إرسال الرد</button>
          </form>
          <form action={closeTicket} className="card form">
            <input type="hidden" name="ticket" value={t.id} />
            <p className="muted small">أغلق التذكرة إذا انتهى الطلب.</p>
            <button className="btn">إغلاق التذكرة</button>
          </form>
        </div>
      )}
    </>
  );
}
