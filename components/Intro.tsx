"use client";
import { useRouter } from "next/navigation";
import { ArrowLeftIcon, PlayIcon } from "./Icons";
import { useLang } from "@/lib/i18n";

// หน้าก่อนเริ่มทำ: บอกล่วงหน้าว่าจะเจออะไร ใช้เวลาเท่าไหร่ (ลดความกังวล) และให้แตะเริ่มเอง
// การแตะนี้ยังปลดล็อกเสียงของเบราว์เซอร์ให้เสียงโจทย์ข้อแรกเล่นอัตโนมัติได้
export default function Intro({ title, lines, badge, onStart }: { title: string; lines: string[]; badge: string; onStart: () => void }) {
  const router = useRouter();
  const { tx } = useLang();
  return (
    <div className="flex flex-1 flex-col justify-between gap-6 pt-4 lg:justify-center lg:gap-10 lg:pt-0">
      <div className="rise space-y-5 text-center">
        <span className="inline-block rounded-full bg-soft px-4 py-1.5 text-base font-semibold text-link">{badge}</span>
        <h1 className="text-3xl font-bold">{title}</h1>
        <ul className="card mx-auto w-full space-y-3 p-5 text-left text-xl">
          {lines.map((l) => (
            <li key={l} className="flex gap-3">
              <span className="mt-2 h-2.5 w-2.5 flex-none rounded-full bg-brand" aria-hidden />
              <span>{l}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="dock space-y-3">
        <button className="btn btn-primary" style={{ minHeight: 84, fontSize: "1.5rem" }} onClick={onStart} autoFocus>
          <PlayIcon /> {tx({ th: "เริ่มเลย", en: "Start" })}
        </button>
        <button className="btn btn-line" onClick={() => router.push("/home")}><ArrowLeftIcon /> {tx({ th: "กลับหน้าหลัก", en: "Back to home" })}</button>
      </div>
    </div>
  );
}
