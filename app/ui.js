import { STATUS, REPORT_STATUS, KIND_LABEL, ROLE_LABEL, TICKET_STATUS } from "@/lib/demo";

export function Logo({ href = "/" }) {
  return (
    <a className="logo" href={href}>
      <span className="mark" />
      <span>أمـــد</span>
      <span className="en">AMAD</span>
    </a>
  );
}

export function Ring({ value, size = 180, label = "مؤشر مدى" }) {
  const r = 70, c = 2 * Math.PI * r;
  const off = c * (1 - Math.max(0, Math.min(100, value)) / 100);
  return (
    <div className="ring" style={{ width: size, height: size }}>
      <svg viewBox="0 0 160 160" aria-hidden="true">
        <defs>
          <linearGradient id="rg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#C9CDD3" />
            <stop offset=".6" stopColor="#4FD8D2" />
            <stop offset="1" stopColor="#4FD8D2" />
          </linearGradient>
        </defs>
        <circle cx="80" cy="80" r={r} fill="none" stroke="var(--bg-2)" strokeWidth="9" />
        <circle cx="80" cy="80" r={r} fill="none" stroke="url(#rg)" strokeWidth="9" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={off} />
      </svg>
      <div className="c">
        <b style={{ fontSize: size < 120 ? "1.8rem" : undefined }}>{value}</b>
        <span>{label}</span>
      </div>
    </div>
  );
}

export const Chip = ({ cls = "", children }) => <span className={"chip " + cls}>{children}</span>;
export const StatusChip = ({ s }) => <Chip cls={STATUS[s]?.cls}>{STATUS[s]?.label}</Chip>;
export const ReportChip = ({ s }) => <Chip cls={REPORT_STATUS[s]?.cls}>{REPORT_STATUS[s]?.label}</Chip>;
export const TicketChip = ({ s }) => <Chip cls={TICKET_STATUS[s]?.cls}>{TICKET_STATUS[s]?.label}</Chip>;
export const RoleChip = ({ r }) => <Chip cls={r === "member" ? "" : "acc"}>{ROLE_LABEL[r]}</Chip>;
export const kindLabel = (k) => KIND_LABEL[k] || k;

export function fmtDate(d) {
  if (!d) return "-";
  return new Date(d).toLocaleDateString("ar-AE-u-nu-latn", { day: "numeric", month: "short", year: "numeric" });
}
export function fmtDateTime(d) {
  if (!d) return "-";
  return new Date(d).toLocaleString("ar-AE-u-nu-latn", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

export function MarkersTable({ markers }) {
  return (
    <div className="tablewrap">
      <table>
        <thead>
          <tr><th>المؤشر</th><th>النتيجة</th><th>النطاق المرجعي</th><th>الحالة</th><th>المعنى</th></tr>
        </thead>
        <tbody>
          {markers.map((m) => (
            <tr key={m.key}>
              <td>{m.name}</td>
              <td className="num" style={{ direction: "ltr", textAlign: "right" }}>{m.value} <span className="muted small">{m.unit}</span></td>
              <td className="muted small">{m.ref}</td>
              <td><StatusChip s={m.status} /></td>
              <td className="muted small">{m.note}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
