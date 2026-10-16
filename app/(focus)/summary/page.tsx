"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowRightIcon } from "@/components/Icons";
import ScoreRing from "@/components/ScoreRing";
import { useLang } from "@/lib/i18n";

type S = {
  outcome: "advance" | "levelup" | "finished" | "retry" | "demote";
  pct: number; level: number; stage: number; toLevel: number; toStage: number;
  total: number; skipped: number; correct: number; practiced: number;
};

type Tx = { th: string; en: string };
const COPY: Record<S["outcome"], { emoji: string; title: Tx; body: (s: S) => Tx; cta: (s: S) => Tx }> = {
  advance: { emoji: "🌟", title: { th: "ผ่านด่านแล้ว!", en: "Stage passed!" }, body: (s) => ({ th: `เก่งมาก ด่านต่อไปคือด่าน ${s.toStage}`, en: `Well done — next up is stage ${s.toStage}.` }), cta: (s) => ({ th: `ไปด่าน ${s.toStage}`, en: `Go to stage ${s.toStage}` }) },
  levelup: { emoji: "🏆", title: { th: "ขึ้นระดับแล้ว!", en: "Level up!" }, body: (s) => ({ th: `ยินดีด้วย เรากำลังไประดับ ${s.toLevel}`, en: `Congratulations — moving on to level ${s.toLevel}.` }), cta: (s) => ({ th: `ไประดับ ${s.toLevel}`, en: `Go to level ${s.toLevel}` }) },
  finished: { emoji: "🎓", title: { th: "จบครบทุกระดับแล้ว!", en: "All levels complete!" }, body: () => ({ th: "ทำได้ยอดเยี่ยมมาก ทบทวนด่านเดิมต่อได้ตลอดนะ", en: "Outstanding work. You can review any stage whenever you like." }), cta: () => ({ th: "ฝึกทบทวน", en: "Review" }) },
  retry: { emoji: "💪", title: { th: "เกือบแล้ว!", en: "Almost there!" }, body: () => ({ th: "ลองทำด่านนี้อีกครั้งนะ ค่อยๆ ไป ฝึกบ่อยๆ จะดีขึ้น", en: "Try this stage once more. Steady practice makes it easier." }), cta: () => ({ th: "ลองอีกครั้ง", en: "Try again" }) },
  demote: { emoji: "🌱", title: { th: "กลับไปทบทวนก่อนนะ", en: "Let\'s review first" }, body: (s) => ({ th: `เราจะพากลับไปด่านที่ง่ายกว่า (ระดับ ${s.toLevel} ด่าน ${s.toStage}) เพื่อฝึกให้มั่นใจ`, en: `We\'ll go back to an easier stage (level ${s.toLevel}, stage ${s.toStage}) to build confidence.` }), cta: () => ({ th: "ไปทบทวน", en: "Go review" }) },
};

export default function Summary() {
  const router = useRouter();
  const { tx } = useLang();
  const [s, setS] = useState<S | null>(null);
  useEffect(() => {
    let data: S | null = null;
    try { data = JSON.parse(sessionStorage.getItem("aphasia.stage") ?? "null"); } catch {}
    if (!data) return router.replace("/practice");
    setS(data);
  }, [router]);
  if (!s) return null;
  const c = COPY[s.outcome];
  const skippedMany = s.total > 0 && s.skipped / s.total > 0.3;
  const counted = s.total - s.skipped;

  return (
    <div className="flex flex-1 flex-col justify-between gap-6 pt-4 lg:justify-center lg:gap-10 lg:pt-0">
      <div className="space-y-5 text-center">
        <div className="pop text-7xl">{c.emoji}</div>
        <h1 className="rise text-3xl font-bold">{tx(c.title)}</h1>
        <div className="card rise space-y-3 p-5" style={{ animationDelay: ".1s" }}>
          <ScoreRing pct={s.pct} label={tx({ th: `คะแนน ${Math.round(s.pct * 100)} เปอร์เซ็นต์`, en: `Score ${Math.round(s.pct * 100)} percent` })} />
          <p className="text-lg text-sub">{tx({ th: `ตอบได้ ${s.correct} จาก ${counted} ข้อ${s.skipped ? ` (ข้าม ${s.skipped} ข้อ ไม่นับคะแนน)` : ""}`, en: `${s.correct} of ${counted} correct${s.skipped ? ` (${s.skipped} skipped, not counted)` : ""}` })}</p>
          {s.practiced > 0 && <p className="text-base text-muted">{tx({ th: `ข้อที่ฝึกพูดตาม ${s.practiced} ข้อ จะกลับมาทำอีก`, en: `${s.practiced} repeat-after-me items will come back later` })}</p>}
        </div>
        <p className="rise text-xl leading-relaxed" style={{ animationDelay: ".2s" }}>{tx(c.body(s))}</p>
        {skippedMany && (
          <p className="alert alert-info rise">
            {tx({ th: "ข้อนี้ข้ามค่อนข้างเยอะ ลองพูดใกล้ไมค์ขึ้นหรือหาที่เงียบๆ นะ ถ้ายังไม่ดีขึ้น ลองปรึกษาผู้เชี่ยวชาญได้", en: "Quite a few were skipped. Try speaking closer to the mic or finding a quiet spot. If it doesn't improve, consider talking to a specialist." })}
          </p>
        )}
      </div>
      <div className="dock space-y-3">
        <button className="btn btn-primary" style={{ minHeight: 84, fontSize: "1.5rem" }} onClick={() => router.push("/practice")}>{tx(c.cta(s))} <ArrowRightIcon /></button>
        <button className="btn btn-line" onClick={() => router.push("/home")}>{tx({ th: "พักก่อน", en: "Take a break" })}</button>
      </div>
    </div>
  );
}
