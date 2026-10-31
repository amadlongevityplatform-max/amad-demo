"use client";

import { useActionState, useState } from "react";
import { createUser, resetPassword } from "../../actions";

export function NewUserForm() {
  const [state, action, pending] = useActionState(createUser, null);
  const [role, setRole] = useState("doctor");
  return (
    <form action={action} className="card form" key={state?.ok ? Date.now() : "f"}>
      <h2>إضافة حساب</h2>
      <label>الاسم<input name="name" required /></label>
      <label>البريد<input name="email" type="email" required dir="ltr" /></label>
      <label>الصلاحية
        <select name="role" value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="doctor">طبيب</option>
          <option value="support">دعم</option>
          <option value="admin">مدير</option>
          <option value="member">عضو</option>
        </select>
      </label>
      {role === "member" && (
        <div className="grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
          <label>العمر<input name="age" type="number" min="18" max="100" /></label>
          <label>المدينة<input name="city" /></label>
        </div>
      )}
      <label>كلمة السر (8 أحرف على الأقل)<input name="password" type="text" required minLength={8} dir="ltr" /></label>
      {state?.error && <div className="alert bad">{state.error}</div>}
      {state?.ok && <div className="alert ok">{state.ok}</div>}
      <button className="btn primary" disabled={pending}>إضافة</button>
    </form>
  );
}

export function ResetForm({ id }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(resetPassword, null);
  if (!open) return <button type="button" className="btn small ghost" onClick={() => setOpen(true)}>كلمة السر</button>;
  return (
    <form action={action} className="row" style={{ gap: 6, flexWrap: "nowrap" }}>
      <input type="hidden" name="user" value={id} />
      <input name="password" placeholder="كلمة سر جديدة" minLength={8} required dir="ltr" style={{ width: 150, padding: "6px 10px" }} />
      <button className="btn small" disabled={pending}>حفظ</button>
      {state?.error && <span className="small" style={{ color: "var(--bad)" }}>{state.error}</span>}
      {state?.ok && <span className="small" style={{ color: "var(--ok)" }}>{state.ok}</span>}
    </form>
  );
}
