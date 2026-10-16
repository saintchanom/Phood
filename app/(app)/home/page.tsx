"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowRightIcon, PlayIcon } from "@/components/Icons";
import { useLang } from "@/lib/i18n";
import { store } from "@/lib/store";
import type { Progress } from "@/lib/types";

const LEVEL_NAME = { 1: { th: "เริ่มต้น", en: "Beginner" }, 2: { th: "ปานกลาง", en: "Intermediate" }, 3: { th: "ก้าวหน้า", en: "Advanced" } } as const;

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="card p-4 lg:p-5">
      <p className="text-base text-sub">{label}</p>
      <p className="mt-1 text-3xl font-bold text-navy">{value}</p>
      {hint && <p className="text-sm text-muted">{hint}</p>}
    </div>
  );
}

export default function Home() {
  const router = useRouter();
  const { tx } = useLang();
  const [name, setName] = useState("");
  const [p, setP] = useState<Progress | null>(null);

  useEffect(() => {
    setName(store.getUser()?.name ?? "");
    setP(store.getProgress());
  }, []);

  if (!p) return null;
  const start = () => router.push(!store.hasConsent() ? "/consent" : p.placed ? "/practice" : "/placement");
  const passedCount = p.history.filter((h) => h.passed).length;
  const last = p.history[p.history.length - 1];

  return (
    <div className="space-y-6">
      <header className="rise">
        <p className="text-lg text-sub">{tx({ th: "สวัสดี", en: "Hello" })}</p>
        <h1 className="text-3xl font-bold lg:text-4xl">{name || tx({ th: "ผู้ใช้", en: "there" })} <span aria-hidden>👋</span></h1>
        <p className="mt-1 text-xl text-sub">{p.placed ? tx({ th: "วันนี้มาฝึกพูดกันต่อนะ", en: "Let's keep practising today." }) : tx({ th: "เริ่มจากแบบทดสอบสั้นๆ เพื่อเลือกระดับที่พอดีกับคุณ", en: "Start with a short test to find the right level for you." })}</p>
      </header>

      <div className="rise grid gap-6 lg:grid-cols-5" style={{ animationDelay: ".06s" }}>
        <section className="card space-y-5 p-5 lg:col-span-3 lg:p-7">
          {p.placed ? (
            <>
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="text-xl font-bold">{tx({ th: "ความก้าวหน้าของคุณ", en: "Your progress" })}</h2>
                <p className="rounded-full bg-soft px-4 py-1 text-lg font-bold text-link">{tx({ th: "ระดับ", en: "Level" })} {p.level} · {tx(LEVEL_NAME[p.level])}</p>
              </div>
              <ol className="flex items-center" aria-label={tx({ th: `ด่าน ${p.stage} จาก 5`, en: `Stage ${p.stage} of 5` })}>
                {[1, 2, 3, 4, 5].map((n) => {
                  const done = n < p.stage || p.completed;
                  return (
                    <li key={n} className="flex flex-1 items-center last:flex-none">
                      <span
                        aria-current={n === p.stage && !p.completed ? "step" : undefined}
                        className={`flex h-12 w-12 flex-none items-center justify-center rounded-full text-xl font-bold lg:h-14 lg:w-14 ${done ? "bg-brand text-white" : n === p.stage ? "bg-white text-link ring-4 ring-brand" : "bg-soft text-muted"}`}
                      >
                        {done ? "✓" : n}
                      </span>
                      {n < 5 && <span className={`mx-1.5 h-1.5 flex-1 rounded-full ${done ? "bg-brand" : "bg-soft"}`} />}
                    </li>
                  );
                })}
              </ol>
              <p className="text-lg text-sub">{p.completed ? tx({ th: "จบครบทุกด่านแล้ว ทบทวนต่อได้ตลอด", en: "All stages complete — you can review any time." }) : tx({ th: `ตอนนี้อยู่ด่าน ${p.stage} จาก 5 ของระดับ ${p.level}`, en: `You are on stage ${p.stage} of 5 in level ${p.level}.` })}</p>
              <button className="btn btn-primary" style={{ minHeight: 76, fontSize: "1.4rem" }} onClick={start}>
                <PlayIcon /> {tx({ th: "ฝึกต่อ", en: "Continue practising" })}
              </button>
            </>
          ) : (
            <>
              <h2 className="text-2xl font-bold">{tx({ th: "ยังไม่ได้ทำแบบทดสอบ", en: "You haven't taken the test yet" })}</h2>
              <p className="text-xl text-sub">{tx({ th: "แบบทดสอบ 15 ข้อ ใช้เวลาประมาณ 5 นาที ไม่มีผิดหรือถูกที่ตัดสินคุณ ใช้เพื่อเลือกระดับแบบฝึกให้พอดี", en: "15 questions, about 5 minutes. Nothing is judged — it just picks the right level for your practice." })}</p>
              <button className="btn btn-primary" style={{ minHeight: 76, fontSize: "1.4rem" }} onClick={start}>
                {tx({ th: "เริ่มทดสอบ", en: "Start the test" })} <ArrowRightIcon />
              </button>
            </>
          )}
        </section>

        <div className="grid grid-cols-2 gap-4 lg:col-span-2 lg:grid-cols-1">
          <Stat label={tx({ th: "ด่านที่ผ่านแล้ว", en: "Stages passed" })} value={`${passedCount}`} hint={tx({ th: "นับจากการฝึกทุกครั้ง", en: "Counted across all sessions" })} />
          <Stat label={tx({ th: "คะแนนครั้งล่าสุด", en: "Latest score" })} value={last ? `${Math.round(last.pct * 100)}%` : "–"} hint={last ? tx({ th: `ระดับ ${last.level} ด่าน ${last.stage}`, en: `Level ${last.level}, stage ${last.stage}` }) : tx({ th: "ยังไม่มีข้อมูล", en: "No data yet" })} />
          <div className="col-span-2 lg:col-span-1"><Stat label={tx({ th: "ข้อที่รอทบทวน", en: "Items to review" })} value={`${p.repeatIds.length}`} hint={tx({ th: "ข้อที่ฝึกพูดตาม จะกลับมาทำอีก", en: "Repeat-after-me items come back later" })} /></div>
        </div>
      </div>
    </div>
  );
}
