"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

// ภาษาของ "หน้าจอ" (ไทย/อังกฤษ) — เนื้อหาที่ฝึก เสียงพูด เฉลย และคำตอบของโค้ชเป็นภาษาไทยเสมอ
export type Lang = "th" | "en";
export type Tx = (o: { th: string; en: string }) => string;

type Ctx = { lang: Lang; setLang: (l: Lang) => void; tx: Tx; locale: string };
const LangCtx = createContext<Ctx>({ lang: "th", setLang: () => {}, tx: (o) => o.th, locale: "th-TH" });
export const useLang = () => useContext(LangCtx);

const KEY = "phood.lang";

function ThaiNotice({ onClose, onBack }: { onClose: () => void; onBack: () => void }) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-navy/50 p-4 backdrop-blur-sm sm:items-center" role="presentation">
      <div role="alertdialog" aria-modal="true" aria-labelledby="th-notice-title" className="pop w-full max-w-lg space-y-4 rounded-[28px] bg-white p-6 shadow-[0_30px_80px_rgba(30,58,95,0.35)]">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl text-2xl font-bold" style={{ background: "var(--orange-soft)", color: "var(--orange-text)" }} aria-hidden>ก</span>
        <h2 id="th-notice-title" className="text-2xl font-bold">Heads up: you&rsquo;ll be practising Thai</h2>
        <p className="text-lg leading-relaxed text-sub">
          Phood helps people practise <strong className="text-navy">speaking Thai</strong>. Everything on screen will be in English, but the{" "}
          <strong className="text-navy">spoken prompts, the picture answers, the sentences to repeat and the coach&rsquo;s replies stay in Thai</strong> — that&rsquo;s the language you&rsquo;re here to practise.
        </p>
        <p className="text-lg leading-relaxed text-sub">To help you get started, you&rsquo;ll see English meanings and romanised pronunciation next to the Thai.</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <button className="btn btn-primary" onClick={onClose} autoFocus>Got it</button>
          <button className="btn btn-line" onClick={onBack}>สลับกลับเป็นไทย</button>
        </div>
      </div>
    </div>
  );
}

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("th");
  const [ready, setReady] = useState(false);
  const [notice, setNotice] = useState(false);

  useEffect(() => {
    let stored: string | null = null;
    try { stored = localStorage.getItem(KEY); } catch {}
    if (stored === "en" || stored === "th") setLangState(stored);
    else if (typeof navigator !== "undefined" && navigator.language?.toLowerCase().startsWith("en")) {
      // ผู้เยี่ยมชมครั้งแรกที่ใช้เบราว์เซอร์ภาษาอังกฤษ: เริ่มที่อังกฤษและแจ้งเตือนก่อน
      setLangState("en");
      setNotice(true);
      try { localStorage.setItem(KEY, "en"); } catch {} // จำไว้ ไม่เด้งเตือนซ้ำทุกครั้งที่เปิดหน้า
    }
    setReady(true);
  }, []);

  useEffect(() => { document.documentElement.lang = lang; }, [lang]);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try { localStorage.setItem(KEY, l); } catch {}
    if (l === "en") setNotice(true);
  }, []);

  const value = useMemo<Ctx>(() => ({
    lang, setLang, tx: (o) => (lang === "en" ? o.en : o.th), locale: lang === "en" ? "en-GB" : "th-TH",
  }), [lang, setLang]);

  // ซ่อนหน้าไว้ก่อนโหลดภาษาที่เลือกไว้ (กันภาพกระพริบจากไทยเป็นอังกฤษ) — ยัง render ตามปกติเพื่อให้ Next ตรวจโครงหน้าได้
  return (
    <LangCtx.Provider value={value}>
      <div style={{ display: "contents", visibility: ready ? "visible" : "hidden" }}>{children}</div>
      {notice && lang === "en" && <ThaiNotice onClose={() => setNotice(false)} onBack={() => { setLang("th"); setNotice(false); }} />}
    </LangCtx.Provider>
  );
}
