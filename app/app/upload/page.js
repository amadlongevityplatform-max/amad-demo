import Uploader from "./uploader";

export default function UploadPage() {
  return (
    <>
      <div className="stack" style={{ gap: 6 }}>
        <h1>ارفع فحصك، وشاهد أمد يقرؤه</h1>
        <p className="muted">اختر نوع التقرير، ثم ملفاً أو "جرّب بمثال".</p>
      </div>
      <div className="alert info">
        هذه نسخة عرض: الملف الذي تختاره لا يُرفع ولا يُحفظ ولا يغادر جهازك. النتيجة تُبنى من بيانات توضيحية. لا تستخدم فحصاً حقيقياً.
      </div>
      <Uploader />
    </>
  );
}
