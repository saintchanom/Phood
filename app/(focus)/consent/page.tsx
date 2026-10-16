"use client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { ArrowLeftIcon, CheckIcon, SpeakerIcon } from "@/components/Icons";
import { installAudioUnlock, speak, stopSpeaking } from "@/lib/speak";
import { useLang } from "@/lib/i18n";
import { store } from "@/lib/store";

const TEXT = "แอปนี้ใช้ไมค์ฟังเสียงของคุณ เพื่อตรวจคำตอบ เราไม่เก็บไฟล์เสียงไว้ ถ้าตกลง กดปุ่มสีน้ำเงิน";

export default function Consent() {
  const router = useRouter();
  const { tx, lang } = useLang();
  useEffect(() => { if (!store.getUser()) router.replace("/login"); }, [router]);
  useEffect(() => { installAudioUnlock(); return () => stopSpeaking(); }, []);

  return (
    <div className="flex flex-1 flex-col justify-between gap-6 pt-4 lg:justify-center lg:gap-10 lg:pt-0">
      <div className="rise space-y-5 text-center">
        <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-[32px] bg-soft text-7xl">🎤</div>
        <h1 className="text-3xl font-bold">{tx({ th: "ก่อนเริ่ม", en: "Before we start" })}</h1>
        <div className="card space-y-3 p-5">
          <p className="text-2xl leading-relaxed">{lang === "en" ? (<>The app uses your <strong>microphone</strong> to listen to your voice<br />and check your answers.</>) : (<>แอปจะใช้<strong>ไมค์</strong>ฟังเสียงของคุณ<br />เพื่อตรวจคำตอบ</>)}</p>
          <p className="text-xl text-sub">{tx({ th: "เราไม่เก็บไฟล์เสียงไว้", en: "We don't keep your audio files." })}</p>
        </div>
        {lang === "th" && <button className="btn btn-ghost !w-auto mx-auto px-6" onClick={() => speak(TEXT)}><SpeakerIcon /> ฟังเสียงอ่าน</button>}
      </div>
      <div className="dock space-y-3">
        <button className="btn btn-primary" style={{ minHeight: 84, fontSize: "1.6rem" }} onClick={() => { store.setConsent(); router.push("/placement"); }}>
          <CheckIcon /> {tx({ th: "ตกลง", en: "I agree" })}
        </button>
        <button className="btn btn-line" onClick={() => router.push("/home")}><ArrowLeftIcon /> {tx({ th: "กลับ", en: "Back" })}</button>
      </div>
    </div>
  );
}
