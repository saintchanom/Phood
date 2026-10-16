"use client";
import { useEffect, useState } from "react";
import { useLang } from "@/lib/i18n";

const KEY = "aphasia.textsize";
const SIZES = [
  { v: "md", th: "ปกติ", en: "Normal", cls: "text-base" },
  { v: "lg", th: "ใหญ่", en: "Large", cls: "text-xl" },
  { v: "xl", th: "ใหญ่มาก", en: "Extra large", cls: "text-2xl" },
] as const;

const applySize = (v: string) => { document.documentElement.dataset.size = v; };

// ปรับขนาดตัวอักษรทั้งแอป (เก็บในเครื่อง) — ผู้สูงอายุควรเลือกขนาดที่อ่านสบายได้เอง
export default function TextSize() {
  const { tx } = useLang();
  const [size, setSize] = useState("md");
  useEffect(() => {
    try { setSize(localStorage.getItem(KEY) ?? "md"); } catch {}
  }, []);
  const pick = (v: string) => {
    setSize(v);
    applySize(v);
    try { localStorage.setItem(KEY, v); } catch {}
  };
  return (
    <div role="radiogroup" aria-label={tx({ th: "ขนาดตัวอักษร", en: "Text size" })} className="flex items-center justify-center gap-2">
      <span className="text-base text-sub">{tx({ th: "ตัวอักษร", en: "Text" })}</span>
      {SIZES.map((s) => (
        <button
          key={s.v}
          role="radio"
          aria-checked={size === s.v}
          aria-label={tx(s)}
          onClick={() => pick(s.v)}
          className={`min-h-12 min-w-12 rounded-xl border-2 px-3 font-semibold ${s.cls} ${size === s.v ? "border-brand bg-soft text-link" : "border-line bg-white text-sub"}`}
        >
          {tx({ th: "ก", en: "A" })}
        </button>
      ))}
    </div>
  );
}
