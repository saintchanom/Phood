// วงกลมแสดงคะแนน (เห็นผลทันทีโดยไม่ต้องอ่านตัวเลข)
export default function ScoreRing({ pct, label }: { pct: number; label: string }) {
  const r = 52, c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(1, pct));
  return (
    <div className="relative mx-auto h-36 w-36" role="img" aria-label={label}>
      <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
        <circle cx="60" cy="60" r={r} fill="none" stroke="var(--blue-soft)" strokeWidth="12" />
        <circle
          cx="60" cy="60" r={r} fill="none" stroke={v >= 0.8 ? "var(--ok)" : "var(--blue)"} strokeWidth="12" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - v)} style={{ transition: "stroke-dashoffset .8s ease-out" }}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-4xl font-bold text-navy">{Math.round(v * 100)}%</span>
    </div>
  );
}
