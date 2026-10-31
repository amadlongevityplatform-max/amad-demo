"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createDemoReport } from "../../actions";

const STEPS = {
  labs: ["استلام الملف", "استخراج الأرقام من التقرير", "مقارنتها بالنطاقات المرجعية", "تحويل النتائج غير الطبيعية لطبيب"],
  inbody: ["استلام الملف", "قراءة العضل والدهون والتوازن", "ربطها بآخر تحليل دم", "تحديث برنامج المدرب"],
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export default function Uploader() {
  const [kind, setKind] = useState("labs");
  const [file, setFile] = useState("");
  const [step, setStep] = useState(-1);
  const [err, setErr] = useState("");
  const router = useRouter();
  const busy = step >= 0;

  async function run() {
    setErr("");
    try {
      const create = createDemoReport(kind);
      for (let i = 0; i < 4; i++) { setStep(i); await sleep(1100); }
      const id = await create;
      setStep(4);
      router.push("/app/report/" + id + "?new=1");
    } catch {
      setErr("لم تكتمل القراءة. حاول مرة أخرى.");
      setStep(-1);
    }
  }

  return (
    <div className="two">
      <div className="card">
        <div className="row">
          <button type="button" className={"btn small " + (kind === "labs" ? "primary" : "")} onClick={() => setKind("labs")} disabled={busy}>تحليل دم</button>
          <button type="button" className={"btn small " + (kind === "inbody" ? "primary" : "")} onClick={() => setKind("inbody")} disabled={busy}>تكوين الجسم InBody</button>
        </div>
        <label className={"drop " + (file ? "has" : "")}>
          <strong style={{ color: "var(--fg)" }}>{file || "اختر صورة أو ملف PDF"}</strong>
          <span className="small">{kind === "labs" ? "نتيجة مختبر من أي جهة" : "تقرير InBody أو Tanita أو Seca"}</span>
          <input type="file" accept="image/*,application/pdf" style={{ display: "none" }} disabled={busy}
            onChange={(e) => setFile(e.target.files?.[0]?.name || "")} />
        </label>
        <div className="row">
          <button type="button" className="btn primary" onClick={run} disabled={busy || !file}>اقرأ الملف</button>
          <button type="button" className="btn" onClick={run} disabled={busy}>جرّب بمثال</button>
        </div>
        {err && <div className="alert bad">{err}</div>}
      </div>
      <div className="card">
        <h3>مراحل القراءة</h3>
        <div className="steps">
          {STEPS[kind].map((t, i) => (
            <div key={t} className={"stepl " + (step > i ? "done" : step === i ? "run" : "")}><i />{t}</div>
          ))}
        </div>
        {step === 4 && <p className="alert ok">اكتملت القراءة، جارٍ فتح التقرير…</p>}
      </div>
    </div>
  );
}
