"use client";
import { useEffect, useState } from "react";
import { CheckIcon, InfoIcon } from "@/components/Icons";
import { useLang } from "@/lib/i18n";
import { store } from "@/lib/store";
import type { Progress } from "@/lib/types";

const fmt = (t: number, locale: string) => new Date(t).toLocaleString(locale, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

export default function ProgressPage() {
  const { tx, locale } = useLang();
  const [p, setP] = useState<Progress | null>(null);
  useEffect(() => { setP(store.getProgress()); }, []);
  if (!p) return null;
  const rows = [...p.history].reverse();
  const avg = rows.length ? Math.round((rows.reduce((a, r) => a + r.pct, 0) / rows.length) * 100) : 0;
  const recent = p.history.slice(-12);

  return (
    <div className="space-y-6">
      <header className="rise">
        <h1 className="text-3xl font-bold lg:text-4xl">{tx({ th: "ความก้าวหน้า", en: "Progress" })}</h1>
        <p className="mt-1 text-xl text-sub">{tx({ th: "ดูว่าที่ผ่านมาฝึกไปแล้วเป็นอย่างไร", en: "See how your practice has gone so far." })}</p>
      </header>

      {rows.length === 0 ? (
        <div className="card rise p-8 text-center">
          <p className="text-2xl font-bold">{tx({ th: "ยังไม่มีประวัติการฝึก", en: "No practice history yet" })}</p>
          <p className="mt-2 text-xl text-sub">{tx({ th: "เมื่อฝึกจบด่านแรก ผลจะมาแสดงที่นี่", en: "Finish your first stage and the results will appear here." })}</p>
        </div>
      ) : (
        <>
          <div className="rise grid grid-cols-3 gap-3 lg:gap-5" style={{ animationDelay: ".05s" }}>
            <div className="card p-4"><p className="text-base text-sub">{tx({ th: "ฝึกแล้ว", en: "Sessions" })}</p><p className="text-3xl font-bold">{rows.length}<span className="text-lg font-semibold text-sub"> {tx({ th: "ครั้ง", en: "total" })}</span></p></div>
            <div className="card p-4"><p className="text-base text-sub">{tx({ th: "ผ่านด่าน", en: "Stages passed" })}</p><p className="text-3xl font-bold">{rows.filter((r) => r.passed).length}</p></div>
            <div className="card p-4"><p className="text-base text-sub">{tx({ th: "คะแนนเฉลี่ย", en: "Average score" })}</p><p className="text-3xl font-bold">{avg}%</p></div>
          </div>

          <section className="card rise p-5 lg:p-7" style={{ animationDelay: ".1s" }}>
            <h2 className="text-xl font-bold">{tx({ th: `คะแนนแต่ละครั้ง (ล่าสุด ${recent.length} ครั้ง)`, en: `Score per session (latest ${recent.length})` })}</h2>
            <div className="mt-4 flex h-40 items-end gap-2" role="img" aria-label={tx({ th: "กราฟคะแนนแต่ละครั้ง", en: "Score per session chart" })}>
              {recent.map((r, i) => (
                <div key={i} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
                  <span className="text-xs font-semibold text-sub">{Math.round(r.pct * 100)}</span>
                  <div className={`w-full rounded-t-lg ${r.passed ? "bg-ok" : "bg-brand/60"}`} style={{ height: `${Math.max(4, r.pct * 100)}%` }} />
                </div>
              ))}
            </div>
            <p className="mt-3 text-sm text-sub"><span className="mr-1 inline-block h-3 w-3 rounded bg-ok align-middle" /> {tx({ th: "ผ่านด่าน", en: "Passed" })} <span className="ml-3 mr-1 inline-block h-3 w-3 rounded bg-brand/60 align-middle" /> {tx({ th: "ยังไม่ผ่าน (ฝึกใหม่ได้)", en: "Not yet (try again anytime)" })}</p>
          </section>

          <section className="rise space-y-3" style={{ animationDelay: ".15s" }}>
            <h2 className="text-xl font-bold">{tx({ th: "ประวัติการฝึก", en: "Practice history" })}</h2>
            <ul className="space-y-3">
              {rows.map((r, i) => (
                <li key={i} className="card flex items-center gap-4 p-4">
                  <span className={`flex h-12 w-12 flex-none items-center justify-center rounded-full ${r.passed ? "bg-ok-soft text-ok" : "bg-soft text-link"}`} style={{ background: r.passed ? "var(--ok-soft)" : undefined }}>
                    {r.passed ? <CheckIcon width="1.5em" height="1.5em" /> : <InfoIcon width="1.5em" height="1.5em" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-lg font-bold">{tx({ th: `ระดับ ${r.level} · ด่าน ${r.stage}`, en: `Level ${r.level} · Stage ${r.stage}` })} <span className="font-semibold text-sub">— {r.passed ? tx({ th: "ผ่าน", en: "Passed" }) : tx({ th: "ฝึกต่อ", en: "Keep practising" })}</span></p>
                    <p className="text-base text-muted">{fmt(r.at, locale)}</p>
                  </div>
                  <p className="text-2xl font-bold text-navy">{Math.round(r.pct * 100)}%</p>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </div>
  );
}
