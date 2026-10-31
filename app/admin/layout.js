import { requireUser } from "@/lib/auth";
import { q } from "@/lib/db";
import { Logo, RoleChip } from "../ui";
import SideNav from "./sidenav";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }) {
  const u = await requireUser(["admin", "doctor", "support"]);
  const c = (await q(
    "SELECT (SELECT count(*) FROM reports WHERE status='needs_review')::int AS reviews, (SELECT count(*) FROM tickets WHERE status='open')::int AS tickets"
  )).rows[0];
  const all = [
    { href: "/admin", label: "نظرة عامة", roles: ["admin", "doctor", "support"] },
    { href: "/admin/members", label: "الأعضاء", roles: ["admin", "doctor", "support"] },
    { href: "/admin/reviews", label: "مراجعات الطبيب", roles: ["admin", "doctor"], count: c.reviews },
    { href: "/admin/tickets", label: "تذاكر الدعم", roles: ["admin", "support"], count: c.tickets },
    { href: "/admin/waitlist", label: "قائمة الانتظار", roles: ["admin"] },
    { href: "/admin/team", label: "الحسابات والصلاحيات", roles: ["admin"] },
    { href: "/admin/activity", label: "سجل النشاط", roles: ["admin"] },
  ];
  const links = all.filter((l) => l.roles.includes(u.role)).map(({ roles, ...l }) => l);
  return (
    <div className="admin">
      <aside className="side">
        <div className="stack" style={{ gap: 4 }}>
          <Logo href="/admin" />
          <span className="muted small">لوحة التحكم</span>
        </div>
        <SideNav links={links} />
        <div className="who">
          <strong>{u.name}</strong>
          <div className="row" style={{ gap: 8 }}>
            <RoleChip r={u.role} />
            <span className="muted small latin" dir="ltr">{u.email}</span>
          </div>
          <form action="/logout" method="post"><button className="btn small">خروج</button></form>
        </div>
      </aside>
      <main className="main">{children}</main>
    </div>
  );
}
