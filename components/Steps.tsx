"use client";
import { useLang } from "@/lib/i18n";

// แถบความคืบหน้าแบบแบ่งช่อง: ผู้ใช้เห็นว่าอยู่ข้อไหนและเหลืออีกกี่ข้อ (ไม่ต้องอ่านตัวเลข)
export default function Steps({ total, current, label }: { total: number; current: number; label: string }) {
  const { tx } = useLang();
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={1}
      aria-valuemax={total}
      aria-valuenow={Math.min(current + 1, total)}
      aria-valuetext={tx({ th: `ข้อ ${Math.min(current + 1, total)} จาก ${total}`, en: `Question ${Math.min(current + 1, total)} of ${total}` })}
      className="flex gap-1"
    >
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className={`h-2.5 flex-1 rounded-full transition-colors duration-300 ${i < current ? "bg-brand" : i === current ? "bg-brand/60 ring-2 ring-brand/30" : "bg-soft"}`}
        />
      ))}
    </div>
  );
}
