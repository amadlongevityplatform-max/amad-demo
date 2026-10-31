import { requireUser } from "@/lib/auth";
import { Logo } from "../ui";
import Nav from "./nav";

export const dynamic = "force-dynamic";

export default async function MemberLayout({ children }) {
  const u = await requireUser(["member"]);
  return (
    <>
      <header className="topbar">
        <div className="in">
          <Logo href="/app" />
          <Nav />
          <div className="row" style={{ gap: 8 }}>
            <span className="small muted">{u.name}</span>
            <form action="/logout" method="post"><button className="btn small ghost">خروج</button></form>
          </div>
        </div>
      </header>
      <main className="page">{children}</main>
    </>
  );
}
