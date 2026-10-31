import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { q } from "@/lib/db";
import { Ring, ReportChip, MarkersTable, fmtDate } from "../../../ui";

export default async function ReportPage({ params, searchParams }) {
  const u = await requireUser(["member"]);
  const { id } = await params;
  const sp = await searchParams;
  const { rows } = await q(
    "SELECT r.*, d.name AS doctor_name FROM reports r LEFT JOIN users d ON d.id=r.doctor_id WHERE r.id=$1 AND r.user_id=$2",
    [Number(id), u.id]
  );
  const r = rows[0];
  if (!r) notFound();
  return (
    <>
      {sp?.new && <div className="alert ok">تمت قراءة الملف التجريبي، وهذا تقريرك.</div>}
      <div className="row between">
        <div className="stack" style={{ gap: 2 }}>
          <span className="muted small">{fmtDate(r.created_at)}</span>
          <h1>{r.title}</h1>
        </div>
        <ReportChip s={r.status} />
      </div>
      <div className="card hero-card">
        <Ring value={r.mada} size={150} />
        <div className="stack" style={{ gap: 8, flex: 1, minWidth: 220 }}>
          <p>عمرك الصحي التقديري حسب هذا التقرير: <strong className="latin">{r.bio_age}</strong></p>
          {r.status === "needs_review" && <p className="alert info">بعض النتائج خارج النطاق، فحوّلناها تلقائياً إلى طبيب مرخص للمراجعة. ستظهر ملاحظته هنا.</p>}
          {r.doctor_note && (
            <div className="stack" style={{ gap: 4 }}>
              <strong>ملاحظة {r.doctor_name}</strong>
              <p>{r.doctor_note}</p>
            </div>
          )}
        </div>
      </div>
      <MarkersTable markers={r.markers} />
      <p className="muted small">أمد لا يشخّص ولا يصف أدوية. هذه قراءة توضيحية لبيانات تجريبية.</p>
      <a href="/app" className="small">العودة إلى لوحتي</a>
    </>
  );
}
