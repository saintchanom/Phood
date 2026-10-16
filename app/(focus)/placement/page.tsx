"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Intro from "@/components/Intro";
import Runner from "@/components/Runner";
import { PLACEMENT, scorePlacement } from "@/lib/placement";
import { useLang } from "@/lib/i18n";
import { store } from "@/lib/store";
import type { ItemResult } from "@/lib/types";

export default function Placement() {
  const router = useRouter();
  const { tx } = useLang();
  const [ok, setOk] = useState(false);
  const [started, setStarted] = useState(false);
  useEffect(() => {
    if (!store.getUser()) return router.replace("/login");
    if (!store.hasConsent()) return router.replace("/consent");
    setOk(true);
  }, [router]);

  if (!ok) return null;

  function finish(results: ItemResult[]) {
    const out = scorePlacement(results);
    const passed = results.filter((r) => r.status === "correct" && r.cues <= 1).length;
    const p = store.getProgress();
    store.setProgress({ ...p, level: out.level, stage: 1, failStreak: 0, completed: false, placed: true });
    try { sessionStorage.setItem("aphasia.placement", JSON.stringify({ ...out, passed, total: PLACEMENT.length })); } catch {}
    router.push("/result");
  }

  if (!started) {
    return (
      <Intro
        badge={tx({ th: "แบบทดสอบ", en: "Placement test" })}
        title={tx({ th: "ลองทำแบบทดสอบสั้นๆ", en: "A short placement test" })}
        lines={[tx({ th: `${PLACEMENT.length} ข้อ ใช้เวลาประมาณ 5 นาที`, en: `${PLACEMENT.length} questions, about 5 minutes` }), tx({ th: "ไม่มีผิดหรือถูกที่ตัดสินคุณ ใช้เพื่อเลือกระดับแบบฝึกที่พอดี", en: "Nothing is judged — it just picks the right practice level" }), tx({ th: "ขอคำใบ้หรือข้ามข้อได้ตลอด", en: "Ask for hints or skip any time" }), tx({ th: "ฟังคำถามแล้วแตะปุ่มไมค์เพื่อพูด (ตอบเป็นภาษาไทย)", en: "Listen, then tap the mic and answer in Thai (English meanings are shown to help)" })]}
        onStart={() => setStarted(true)}
      />
    );
  }

  return <Runner items={PLACEMENT} stopAfterWrong={3} onFinish={finish} label={tx({ th: "แบบทดสอบ", en: "Placement test" })} />;
}
