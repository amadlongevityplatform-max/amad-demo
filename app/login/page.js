import { redirect } from "next/navigation";
import { currentUser, homeFor } from "@/lib/auth";
import LoginForm from "./form";
import { Logo } from "../ui";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const u = await currentUser();
  if (u) redirect(homeFor(u));
  return (
    <div className="login">
      <div className="card">
        <Logo />
        <div className="stack" style={{ gap: 4 }}>
          <h1>تسجيل الدخول</h1>
          <p className="muted">الدخول متاح لحسابات العرض التجريبية فقط.</p>
        </div>
        <LoginForm />
        <a href="/" className="small muted">العودة إلى الموقع</a>
      </div>
    </div>
  );
}
