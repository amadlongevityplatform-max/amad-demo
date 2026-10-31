import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { q, audit } from "@/lib/db";
import { submitReview } from "../../../actions";
import { Ring, ReportChip, MarkersTable, fmtDate } from "../../../ui";

export default async function Review({ params }) {
  const u = await requireUser(["admin", "doctor"]);
  const { id } = await params;
  const r = (await q(
    "SELECT r.*, m.name, m.age, m.gender, m.id AS member_id, d.name AS doctor_name FROM reports r JOIN users m ON m.id=r.user_id LEFT JOIN users d ON d.id=r.doctor_id WHERE r.id=$1",
    [Number(id)]
  )).rows[0];
  if (!r) notFound();
  await audit(u.id, "report_viewed", "فتح التقرير #" + r.id + " لـ " + r.name);
  return (
    <>
      <a href="/admin/reviews" className="small">كل المراجعات</a>
      <div className="row between">
        <div className="stack" style={{ gap: 2 }}>
          <span className="muted small">{fmtDate(r.created_at)}</span>
          <h1>{r.title}: {r.name}</h1>
        </div>
        <ReportChip s={r.status} />
      </div>
      <div className="two">
        <div className="card hero-card">
          <Ring value={r.mada} size={140} />
          <div className="stack" style={{ gap: 4 }}>
            <span>العمر <span className="latin">{r.age ?? "-"}</span> · {r.gender || "-"}</span>
            <span className="muted small">العمر الصحي التقديري <span className="latin">{r.bio_age}</span></span>
            <a href={"/admin/members/" + r.member_id} className="small">الملف الكامل للعضو</a>
          </div>
        </div>
        {r.status === "reviewed" ? (
          <div className="card">
            <h3>ملاحظة {r.doctor_name}</h3>
            <p>{r.doctor_note}</p>
            <span className="muted small">{fmtDate(r.reviewed_at)}</span>
          </div>
        ) : (
          <form action={submitReview} className="card form">
            <input type="hidden" name="report" value={r.id} />
            <h3>ملاحظتك للعضو</h3>
            <textarea name="note" required maxLength={4000} placeholder="مثال: أنصح بزيارة طبيب عام خلال أسبوعين، والاستمرار في الخطة الحالية." />
            <button className="btn primary">اعتماد المراجعة وإرسالها للعضو</button>
          </form>
        )}
      </div>
      <MarkersTable markers={r.markers} />
    </>
  );
}
