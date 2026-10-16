"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Intro from "@/components/Intro";
import Runner from "@/components/Runner";
import { stageSession } from "@/lib/content";
import { applyStageResult } from "@/lib/rules";
import { useLang } from "@/lib/i18n";
import { store } from "@/lib/store";
import type { Item, ItemResult, Progress } from "@/lib/types";

export default function Practice() {
  const router = useRouter();
  const { tx } = useLang();
  const [state, setState] = useState<{ p: Progress; items: Item[] } | null>(null);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (!store.getUser()) return router.replace("/login");
    if (!store.hasConsent()) return router.replace("/consent");
    const p = store.getProgress();
    if (!p.placed) return router.replace("/placement");
    setState({ p, items: stageSession(p.level, p.stage, p.repeatIds) });
  }, [router]);

  if (!state) return null;
  const { p, items } = state;

  function finish(results: ItemResult[]) {
    const { next, outcome, pct } = applyStageResult(p, results);
    store.setProgress(next);
    const skipped = results.filter((r) => r.status === "skipped").length;
    try {
      sessionStorage.setItem("aphasia.stage", JSON.stringify({
        outcome, pct, level: p.level, stage: p.stage, toLevel: next.level, toStage: next.stage,
        total: results.length, skipped, correct: results.filter((r) => r.status === "correct").length,
        practiced: results.filter((r) => r.status === "practiced").length,
      }));
    } catch {}
    router.push("/summary");
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-5 text-center">
        <p className="text-6xl" aria-hidden>🛠️</p>
        <h1 className="text-3xl font-bold">{tx({ th: "ด่านนี้ยังไม่มีแบบฝึก", en: "No exercises in this stage yet" })}</h1>
        <p className="text-xl text-sub">{tx({ th: `ระดับ ${p.level} · ด่าน ${p.stage} กำลังเตรียมเนื้อหาอยู่ ลองกลับไปหน้าหลักแล้วกลับมาใหม่ภายหลังนะ`, en: `Level ${p.level}, stage ${p.stage} is still being prepared. Go back home and try again later.` })}</p>
        <button className="btn btn-primary" style={{ minHeight: 72 }} onClick={() => router.push("/home")}>{tx({ th: "กลับหน้าหลัก", en: "Back to home" })}</button>
      </div>
    );
  }

  if (!started) {
    return (
      <Intro
        badge={tx({ th: `ระดับ ${p.level} · ด่าน ${p.stage} จาก 5`, en: `Level ${p.level} · Stage ${p.stage} of 5` })}
        title={tx({ th: "พร้อมฝึกไหม", en: "Ready to practise?" })}
        lines={[tx({ th: `วันนี้มี ${items.length} ข้อ ใช้เวลาประมาณ ${Math.max(5, Math.round(items.length * 1.2))} นาที`, en: `${items.length} questions today, about ${Math.max(5, Math.round(items.length * 1.2))} minutes` }), tx({ th: "ตอบถูกอย่างน้อย 80% ของข้อที่ทำ จึงผ่านด่านนี้ (ข้อที่ข้ามไม่นับ)", en: "Answer at least 80% of the questions you attempt to pass (skipped ones don't count)" }), tx({ th: "ถ้านึกไม่ออก ขอคำใบ้ได้ถึง 3 ขั้น หรือข้ามข้อได้", en: "Stuck? Ask for up to 3 hints, or skip" }), tx({ th: "ค่อยๆ ทำ ไม่ต้องรีบ", en: "Take your time. Answers are spoken in Thai." })]}
        onStart={() => setStarted(true)}
      />
    );
  }

  return <Runner key={`${p.level}-${p.stage}`} items={items} onFinish={finish} label={tx({ th: `ระดับ ${p.level} · ด่าน ${p.stage}`, en: `Level ${p.level} · Stage ${p.stage}` })} />;
}
