// Illustrative health data for fictional people only. Nothing here reads a real file.

const r = (a, b, d = 1) => {
  const v = a + Math.random() * (b - a);
  const p = Math.pow(10, d);
  return Math.round(v * p) / p;
};

export const STATUS = {
  opt: { label: "مثالي", cls: "ok", points: 100 },
  norm: { label: "طبيعي", cls: "ok", points: 90 },
  att: { label: "يحتاج انتباه", cls: "warn", points: 65 },
  doc: { label: "يُحوَّل لطبيب", cls: "bad", points: 40 },
};

const LAB_MARKERS = [
  { key: "vitd", name: "فيتامين د", unit: "ng/mL", ref: "30 إلى 60", d: 0,
    ranges: { opt: [40, 55], norm: [30, 39], att: [18, 29], doc: [8, 15] },
    note: { opt: "مستوى ممتاز.", norm: "ضمن النطاق.", att: "أقل من الموصى به، شائع في المنطقة لقلة التعرض للشمس.", doc: "نقص واضح يحتاج رأي طبيب." } },
  { key: "hba1c", name: "السكر التراكمي HbA1c", unit: "%", ref: "أقل من 5.7", d: 1,
    ranges: { opt: [4.8, 5.2], norm: [5.3, 5.6], att: [5.7, 6.0], doc: [6.1, 6.8] },
    note: { opt: "ممتاز.", norm: "ضمن الطبيعي.", att: "أعلى قليلاً، مرحلة ما قبل السكري.", doc: "مرتفع، يُحوَّل لطبيب مرخص." } },
  { key: "ldl", name: "الكوليسترول الضار LDL", unit: "mmol/L", ref: "أقل من 2.6", d: 1,
    ranges: { opt: [1.6, 2.2], norm: [2.3, 2.6], att: [2.7, 3.3], doc: [3.4, 4.4] },
    note: { opt: "ممتاز.", norm: "ضمن المستهدف.", att: "أعلى قليلاً من المستهدف.", doc: "أعلى من مستوى الوقاية لأمراض القلب." } },
  { key: "tg", name: "الدهون الثلاثية", unit: "mmol/L", ref: "أقل من 1.7", d: 1,
    ranges: { opt: [0.6, 1.0], norm: [1.1, 1.6], att: [1.7, 2.2], doc: [2.3, 3.5] },
    note: { opt: "ممتاز.", norm: "ضمن الطبيعي.", att: "أعلى قليلاً، مرتبط غالباً بالسكريات والنشاط.", doc: "مرتفع ويحتاج متابعة طبيب." } },
  { key: "ferritin", name: "الفيريتين (مخزون الحديد)", unit: "ng/mL", ref: "30 إلى 300", d: 0,
    ranges: { opt: [70, 150], norm: [30, 69], att: [18, 29], doc: [5, 15] },
    note: { opt: "مخزون جيد.", norm: "ضمن النطاق.", att: "مخزون منخفض.", doc: "نقص واضح في الحديد." } },
  { key: "tsh", name: "الغدة الدرقية TSH", unit: "mIU/L", ref: "0.4 إلى 4.0", d: 1,
    ranges: { opt: [1.0, 2.5], norm: [0.5, 3.9], att: [4.1, 6.0], doc: [6.5, 10] },
    note: { opt: "ممتاز.", norm: "ضمن الطبيعي.", att: "أعلى قليلاً من النطاق.", doc: "خارج النطاق ويحتاج طبيب." } },
  { key: "crp", name: "الالتهاب hs-CRP", unit: "mg/L", ref: "أقل من 1.0", d: 1,
    ranges: { opt: [0.2, 0.6], norm: [0.7, 1.0], att: [1.1, 3.0], doc: [3.1, 8.0] },
    note: { opt: "منخفض جداً.", norm: "ضمن الطبيعي.", att: "التهاب منخفض الدرجة.", doc: "التهاب مرتفع يحتاج تقييم طبيب." } },
  { key: "b12", name: "فيتامين ب12", unit: "pg/mL", ref: "200 إلى 900", d: 0,
    ranges: { opt: [450, 800], norm: [250, 449], att: [180, 249], doc: [100, 170] },
    note: { opt: "ممتاز.", norm: "ضمن النطاق.", att: "قريب من الحد الأدنى.", doc: "نقص يحتاج رأي طبيب." } },
];

const INBODY_MARKERS = [
  { key: "smm", name: "الكتلة العضلية الهيكلية", unit: "kg", ref: "حسب الطول والجنس", d: 1,
    ranges: { opt: [33, 38], norm: [28, 32.9], att: [24, 27.9], doc: [19, 23.9] },
    note: { opt: "كتلة عضلية ممتازة.", norm: "جيدة.", att: "أقل من المناسب، برنامج المقاومة يساعد.", doc: "منخفضة بوضوح." } },
  { key: "pbf", name: "نسبة الدهون في الجسم", unit: "%", ref: "10 إلى 20 للرجال", d: 1,
    ranges: { opt: [12, 17], norm: [17.1, 21], att: [21.1, 27], doc: [27.1, 34] },
    note: { opt: "ممتازة.", norm: "ضمن النطاق.", att: "أعلى من المناسب.", doc: "مرتفعة وتحتاج خطة ومتابعة." } },
  { key: "vfl", name: "مستوى الدهون الحشوية", unit: "مستوى", ref: "أقل من 10", d: 0,
    ranges: { opt: [3, 5], norm: [6, 9], att: [10, 12], doc: [13, 17] },
    note: { opt: "منخفض جداً.", norm: "ضمن الطبيعي.", att: "أعلى من الحد.", doc: "مرتفع ومرتبط بمخاطر القلب." } },
  { key: "balance", name: "توازن الأطراف", unit: "%", ref: "فرق أقل من 5", d: 0,
    ranges: { opt: [0, 2], norm: [3, 5], att: [6, 9], doc: [10, 14] },
    note: { opt: "متوازن.", norm: "فرق بسيط.", att: "فرق ملحوظ بين الجانبين.", doc: "فرق كبير يحتاج تقييم." } },
];

function pickStatus(bias = 0) {
  // bias > 0 makes results worse
  const x = Math.random() + bias;
  if (x < 0.35) return "opt";
  if (x < 0.75) return "norm";
  if (x < 1.0) return "att";
  return "doc";
}

export function generateReport(kind, bias = 0.15) {
  const defs = kind === "inbody" ? INBODY_MARKERS : LAB_MARKERS;
  const markers = defs.map((m) => {
    const st = pickStatus(bias);
    const [a, b] = m.ranges[st];
    return { key: m.key, name: m.name, unit: m.unit, ref: m.ref, value: r(a, b, m.d), status: st, note: m.note[st] };
  });
  const mada = Math.round(markers.reduce((s, m) => s + STATUS[m.status].points, 0) / markers.length);
  const needsReview = markers.some((m) => m.status === "doc");
  return {
    kind,
    title: kind === "inbody" ? "تقرير تكوين الجسم InBody" : "تحليل دم شامل",
    markers,
    mada,
    status: needsReview ? "needs_review" : "ready",
  };
}

export function bioAge(age, mada) {
  return Math.round((age + (78 - mada) / 3) * 10) / 10;
}

export const KIND_LABEL = { labs: "تحليل دم", inbody: "تكوين الجسم" };
export const REPORT_STATUS = {
  ready: { label: "جاهز", cls: "ok" },
  needs_review: { label: "بانتظار الطبيب", cls: "warn" },
  reviewed: { label: "راجعه الطبيب", cls: "acc" },
};
export const ROLE_LABEL = { member: "عضو", admin: "مدير", doctor: "طبيب", support: "دعم" };
export const TICKET_STATUS = {
  open: { label: "مفتوحة", cls: "warn" },
  answered: { label: "تم الرد", cls: "acc" },
  closed: { label: "مغلقة", cls: "" },
};
