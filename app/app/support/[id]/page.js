import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { q } from "@/lib/db";
import { memberReply } from "../../../actions";
import { TicketChip, fmtDateTime } from "../../../ui";

export default async function Ticket({ params }) {
  const u = await requireUser(["member"]);
  const { id } = await params;
  const t = (await q("SELECT * FROM tickets WHERE id=$1 AND user_id=$2", [Number(id), u.id])).rows[0];
  if (!t) notFound();
  const { rows: msgs } = await q(
    "SELECT m.*, a.name, a.role FROM ticket_messages m JOIN users a ON a.id=m.author_id WHERE ticket_id=$1 ORDER BY created_at",
    [t.id]
  );
  return (
    <>
      <div className="row between"><h1>{t.subject}</h1><TicketChip s={t.status} /></div>
      <div className="card stack">
        {msgs.map((m) => (
          <div key={m.id} className={"msg " + (m.author_id === u.id ? "mine" : "them")}>
            <span className="meta">{m.author_id === u.id ? "أنت" : m.name} · {fmtDateTime(m.created_at)}</span>
            <p>{m.body}</p>
          </div>
        ))}
      </div>
      {t.status !== "closed" ? (
        <form action={memberReply} className="card form">
          <input type="hidden" name="ticket" value={t.id} />
          <label>ردّك<textarea name="body" required maxLength={4000} /></label>
          <button className="btn primary">إرسال</button>
        </form>
      ) : <p className="muted">هذه المحادثة مغلقة.</p>}
      <a href="/app/support" className="small">كل الرسائل</a>
    </>
  );
}
