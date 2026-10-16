"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowRightIcon } from "@/components/Icons";
import { estimateWeeks } from "@/lib/placement";
import { useLang } from "@/lib/i18n";
import type { Level } from "@/lib/types";

type R = { level: Level; seeDoctor: boolean; passed: number; total: number };
const NAME = { 1: { th: "เริ่มต้น", en: "Beginner" }, 2: { th: "ปานกลาง", en: "Intermediate" }, 3: { th: "ก้าวหน้า", en: "Advanced" } } as const;

export default function Result() {
  const router = useRouter();
  const { tx, lang } = useLang();
  const [r, setR] = useState<R | null>(null);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    let data: R | null = null;
    try { data = JSON.parse(sessionStorage.getItem("aphasia.placement") ?? "null"); } catch {}
    if (!data) return router.replace("/home");
    setR(data);
    fetch("/api/placement", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...data, lang }) })
      .then((x) => x.json()).then((j) => setMsg(j.message)).catch(() => {});
  }, [router, lang]);

  if (!r) return null;
  const w = estimateWeeks(r.level);

  return (
    <div className="flex flex-1 flex-col justify-between gap-6 pt-4 lg:justify-center lg:gap-10 lg:pt-0">
      <div className="space-y-5 text-center">
        <div className="pop text-7xl">🎉</div>
        <h1 className="rise text-3xl font-bold">{tx({ th: "ทำแบบทดสอบเสร็จแล้ว", en: "Test complete" })}</h1>
        <div className="card rise mx-auto w-full space-y-4 p-6" style={{ animationDelay: ".1s" }}>
          <p className="text-lg text-sub">{tx({ th: "เราจะเริ่มฝึกที่", en: "You'll start at" })}</p>
          <p className="text-6xl font-bold text-brand">{tx({ th: "ระดับ", en: "Level" })} {r.level}</p>
          <p className="text-xl font-semibold text-link">{tx(NAME[r.level])}</p>
          <ol className="mx-auto flex max-w-xs items-center" aria-label={tx({ th: `ระดับ ${r.level} จาก 3`, en: `Level ${r.level} of 3` })}>
            {[1, 2, 3].map((n) => (
              <li key={n} className="flex flex-1 items-center last:flex-none">
                <span className={`flex h-10 w-10 items-center justify-center rounded-full text-lg font-bold ${n === r.level ? "bg-brand text-white ring-4 ring-brand/25" : n < r.level ? "bg-brand/70 text-white" : "bg-soft text-muted"}`}>{n}</span>
                {n < 3 && <span className={`mx-1 h-1.5 flex-1 rounded-full ${n < r.level ? "bg-brand/70" : "bg-soft"}`} />}
              </li>
            ))}
          </ol>
        </div>
        {msg && <p className="rise text-xl leading-relaxed" style={{ animationDelay: ".2s" }}>{msg}</p>}
        <p className="rise rounded-2xl bg-soft p-4 text-lg text-link" style={{ animationDelay: ".25s" }}>
          {lang === "en" ? (<>Practise one stage a day (10–20 minutes). About <strong>{w} weeks</strong> to finish every level.</>) : (<>ฝึกวันละ 1 ด่าน (10–20 นาที) ใช้เวลาโดยประมาณ <strong>{w} สัปดาห์</strong> จนจบทุกระดับ</>)}
        </p>
        {r.seeDoctor && (
          <p className="alert alert-warn rise" style={{ animationDelay: ".3s" }}>
            <span aria-hidden>🩺</span>
            <span>{tx({ th: "ผลวันนี้ตอบได้น้อย แนะนำให้ปรึกษาแพทย์หรือนักแก้ไขการพูด เพื่อให้ได้คำแนะนำที่เหมาะกับคุณ แล้วค่อยฝึกกับแอปนี้ควบคู่กันได้", en: "You answered few questions today. We suggest talking to a doctor or speech therapist for advice that suits you — you can practise with this app alongside that." })}</span>
          </p>
        )}
      </div>
      <div className="dock">
        <button className="btn btn-primary" style={{ minHeight: 84, fontSize: "1.5rem" }} onClick={() => router.push("/practice")}>
          {tx({ th: "เริ่มฝึกด่าน 1", en: "Start stage 1" })} <ArrowRightIcon />
        </button>
      </div>
    </div>
  );
}
