"use client";

import { useActionState } from "react";
import { loginAction } from "../actions";

export default function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, null);
  return (
    <form action={action} className="form">
      <label>البريد الإلكتروني
        <input name="email" type="email" required autoComplete="username" dir="ltr" />
      </label>
      <label>كلمة السر
        <input name="password" type="password" required autoComplete="current-password" dir="ltr" />
      </label>
      {state?.error && <div className="alert bad">{state.error}</div>}
      <button className="btn primary" disabled={pending}>{pending ? "جارٍ الدخول…" : "دخول"}</button>
    </form>
  );
}
