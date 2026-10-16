"use client";
import { useLang } from "@/lib/i18n";

// สลับภาษาหน้าจอ ไทย / English
export default function LangSwitch({ className = "" }: { className?: string }) {
  const { lang, setLang } = useLang();
  const opt = (v: "th" | "en", label: string, aria: string) => (
    <button
      role="radio"
      aria-checked={lang === v}
      aria-label={aria}
      onClick={() => lang !== v && setLang(v)}
      className={`min-h-10 min-w-12 rounded-full px-3 text-base font-bold transition-colors ${lang === v ? "bg-brand text-white" : "text-sub hover:text-link"}`}
    >
      {label}
    </button>
  );
  return (
    <div role="radiogroup" aria-label="Language / ภาษา" className={`inline-flex items-center gap-0.5 rounded-full border-2 border-line bg-white p-0.5 ${className}`}>
      {opt("th", "ไทย", "ภาษาไทย")}
      {opt("en", "EN", "English")}
    </div>
  );
}
