"use client";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { cuesFor, promptSpeech } from "@/lib/cues";
import { MODE_LABEL, MODE_LABEL_EN } from "@/lib/content";
import { glossOf } from "@/lib/glosses";
import { useLang } from "@/lib/i18n";
import { installAudioUnlock, onAudioBlocked, speak, speechSupport, stopSpeaking, unlockAudio } from "@/lib/speak";
import type { Item, ItemResult, ItemStatus } from "@/lib/types";
import { AlertIcon, ArrowLeftIcon, ArrowRightIcon, BulbIcon, CheckIcon, InfoIcon, MicIcon, SkipIcon, SpeakerIcon } from "./Icons";
import Steps from "./Steps";
import { LOCAL_MODE, speechRecognitionSupported, useRecorder } from "./useRecorder";

type Fb = { tone: "ok" | "warn" | "info"; text: string };
type Turn = { role: "coach" | "user"; text: string };

const PRAISE = ["เก่งมาก!", "ถูกต้อง เยี่ยมเลย!", "ดีมากเลย!", "สุดยอด!"]; // เสียงชมเป็นภาษาไทยเสมอ
const PRAISE_EN = ["Great job!", "Correct, well done!", "Very good!", "Excellent!"];
const MAX_ATTEMPTS = 3; // ครั้งแรก + ลองใหม่ได้ 2 ครั้ง

export default function Runner({
  items,
  stopAfterWrong,
  onFinish,
  label,
}: {
  items: Item[];
  stopAfterWrong?: number;
  onFinish: (results: ItemResult[]) => void;
  label: string;
}) {
  const router = useRouter();
  const { tx, lang } = useLang();
  const { recording, autoStopped, start, stop } = useRecorder();
  const finishing = useRef(false);
  const [confirmExit, setConfirmExit] = useState(false);
  const [soundBlocked, setSoundBlocked] = useState(false);
  const [idx, setIdx] = useState(0);
  const [cueLevel, setCueLevel] = useState(0);
  const [cueText, setCueText] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [busy, setBusy] = useState(false);
  const [fb, setFb] = useState<Fb | null>(null);
  const [selfReport, setSelfReport] = useState(false);
  const [done, setDone] = useState<ItemStatus | null>(null); // ข้อนี้จบแล้ว รอกดข้อต่อไป
  const [chat, setChat] = useState<Turn[]>([]);
  const [chatRounds, setChatRounds] = useState(0);
  const [micError, setMicError] = useState("");
  const [heard, setHeard] = useState("");
  const [env, setEnv] = useState<string[]>([]);
  const resultsRef = useRef<ItemResult[]>([]);

  const item = items[idx];

  useEffect(() => {
    setCueLevel(0); setCueText(""); setAttempts(0); setBusy(false); setFb(null);
    setSelfReport(false); setDone(null); setChat([]); setChatRounds(0); setMicError(""); setHeard("");
    if (item) void speak(promptSpeech(item), { id: item.id });
    return () => stopSpeaking();
  }, [idx]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => onAudioBlocked(setSoundBlocked), []);

  useEffect(() => {
    installAudioUnlock();
    const t = setTimeout(async () => {
      const w: string[] = [];
      const sp = speechSupport();
      if (!sp.ok && sp.reason) w.push(tx(sp.reason));
      if (LOCAL_MODE && !speechRecognitionSupported()) w.push(tx({ th: "เบราว์เซอร์นี้ฟังเสียงพูดไม่ได้ ให้เปิดแอปใน Safari หรือ Chrome ปกติ (ไม่ใช่หน้าต่างพรีวิวในแอป)", en: "This browser can't listen to speech. Open the app in regular Safari or Chrome (not an in-app preview)." }));
      try {
        const st = await navigator.permissions?.query({ name: "microphone" as PermissionName });
        if (st?.state === "denied") w.push(tx({ th: "ไมค์ถูกบล็อก: กดไอคอนแม่กุญแจข้างช่องที่อยู่เว็บ แล้วเปิด “ไมโครโฟน” จากนั้นรีเฟรชหน้า", en: "Microphone blocked: click the padlock beside the address bar, allow “Microphone”, then refresh." }));
      } catch {}
      setEnv(w);
    }, 600);
    return () => clearTimeout(t);
  }, [tx]);

  function complete(status: ItemStatus, cues = cueLevel, att = attempts + 1) {
    const r: ItemResult = { id: item.id, status, cues, attempts: att };
    resultsRef.current = [...resultsRef.current, r];
    setDone(status);
    setSelfReport(false);
    if (status === "correct") {
      const msg = PRAISE[idx % PRAISE.length];
      setFb({ tone: "ok", text: lang === "en" ? `${PRAISE_EN[idx % PRAISE.length]} · ${msg}` : msg });
      void speak(msg);
    } else if (status === "practiced") {
      setFb({ tone: "info", text: tx({ th: "ดีมาก ได้ฝึกข้อนี้แล้ว เดี๋ยวเรากลับมาลองอีกครั้งนะ", en: "Nice work — you practised this one. We'll come back to it later." }) });
    } else if (status === "skipped") {
      setFb({ tone: "info", text: tx({ th: "ไม่เป็นไร ข้ามข้อนี้ก่อนนะ", en: "No problem — skipping this one for now." }) });
    } else {
      setFb({ tone: "info", text: tx({ th: "ไม่เป็นไรนะ ไปข้อต่อไปกัน", en: "That's okay — let's move on." }) });
    }
  }

  function next() {
    const all = resultsRef.current;
    if (stopAfterWrong) {
      let streak = 0;
      for (let i = all.length - 1; i >= 0 && all[i].status !== "correct"; i--) streak++;
      if (streak >= stopAfterWrong) return onFinish(all);
    }
    if (idx + 1 >= items.length) return onFinish(all);
    setIdx(idx + 1);
  }

  function failedAttempt(kind: "incorrect" | "unsure") {
    const a = attempts + 1;
    setAttempts(a);
    if (a >= MAX_ATTEMPTS) {
      if (kind === "incorrect") return complete("wrong", cueLevel, a);
      setFb({ tone: "warn", text: tx({ th: "ฟังไม่ค่อยชัดเลย ถ้าเมื่อกี้พูดได้แล้ว กดปุ่ม “ฉันตอบได้” ได้เลย", en: "I couldn't hear that clearly. If you said it, tap “I got it”." }) });
      return setSelfReport(true);
    }
    const msg = kind === "incorrect" ? "ลองอีกครั้งนะ" : "ฟังไม่ค่อยชัด ลองพูดอีกครั้งนะ"; // พูดเป็นไทย
    const en = kind === "incorrect" ? "Try again" : "Couldn't hear you clearly, please try again";
    setFb({ tone: "warn", text: lang === "en" ? `${en} · ${msg}` : msg });
    void speak(msg);
  }

  // แตะเริ่มอัด (ถ้ากำลังอัดอยู่ แตะ = จบเอง) · ระบบตัดให้อัตโนมัติเมื่อพูดจบ (ดู autoStopped)
  async function onMic() {
    setMicError("");
    if (busy || done) return;
    if (recording) return finishRec();
    stopSpeaking();
    if (LOCAL_MODE && !speechRecognitionSupported()) {
      setMicError(tx({ th: "เบราว์เซอร์นี้ไม่รองรับการฟังเสียง ใช้ Chrome หรือ Safari แล้วลองใหม่ (หรือกด “ข้ามข้อนี้”)", en: "This browser doesn't support speech listening. Use Chrome or Safari and try again (or tap “Skip”)." }));
      return;
    }
    try { await start(); } catch { setMicError(tx({ th: "เปิดไมค์ไม่ได้ กรุณาอนุญาตการใช้ไมค์ในเบราว์เซอร์", en: "Couldn't open the microphone. Please allow microphone access in your browser." })); }
  }

  async function finishRec() {
    if (finishing.current) return;
    finishing.current = true;
    const cap = await stop();
    setBusy(true);
    setFb(null);
    try {
      // ขั้น 3 ของคำใบ้ = พูดตาม: ไม่ตัดสิน นับว่าได้ฝึก
      if (cueLevel >= 3) return complete("practiced", 3, attempts + 1);

      let text = cap.text ?? "";
      // อัดสั้นเกินไป/ไม่มีเสียง: ไม่ส่งถอดเสียง (ElevenLabs ตอบ "ไฟล์เสียหาย") ถือว่าไม่ได้ยิน
      if (!LOCAL_MODE && (!cap.blob || cap.blob.size < 1500)) {
        text = "";
      } else if (!LOCAL_MODE) {
        const fd = new FormData();
        fd.append("audio", cap.blob!, "speech.webm");
        const tr = await fetch("/api/transcribe", { method: "POST", body: fd });
        if (!tr.ok) throw new Error("transcribe");
        text = ((await tr.json()) as { text: string }).text;
      }
      setHeard(text);

      if (item.mode === "question") {
        const round = chatRounds + 1;
        const history = chat;
        const r = await fetch("/api/chat", {
          method: "POST", headers: { "content-type": "application/json" },
          body: JSON.stringify({ itemId: item.id, transcript: text, history, round }),
        });
        const c = (await r.json()) as { relevant: boolean; reply: string };
        if (!c.relevant && round === 1) return failedAttempt(text.trim() ? "incorrect" : "unsure");
        setChat([...history, { role: "user", text }, { role: "coach", text: c.reply }]);
        setChatRounds(round);
        setAttempts(0);
        setFb({ tone: "ok", text: c.reply });
        if (round === 1) {
          resultsRef.current = [...resultsRef.current]; // ตัดสินตอนกด “ข้อต่อไป”
          void speak(c.reply);
        } else {
          complete("correct", cueLevel, attempts + 1);
          setFb({ tone: "ok", text: c.reply });
          void speak(c.reply);
        }
        return;
      }

      const jr = await fetch("/api/judge", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ itemId: item.id, transcript: text }),
      });
      const { verdict } = (await jr.json()) as { verdict: "correct" | "incorrect" | "unsure" };
      if (verdict === "correct") complete("correct");
      else failedAttempt(verdict);
    } catch {
      failedAttempt("unsure");
    } finally {
      setBusy(false);
      finishing.current = false;
    }
  }

  function askCue() {
    const lv = Math.min(3, cueLevel + 1);
    setCueLevel(lv);
    const c = cuesFor(item, lang)[lv - 1];
    setCueText(c.text);
    setFb(null);
    if (c.speak) void speak(c.speak);
  }

  // พูดจบ (เงียบต่อเนื่อง) → ตัดและส่งตรวจเอง ผู้ใช้ไม่ต้องกด
  useEffect(() => { if (autoStopped && recording) void finishRec(); }, [autoStopped, recording]); // eslint-disable-line react-hooks/exhaustive-deps

  // ทางลัดคีย์บอร์ด (เดสก์ท็อป): Space = พูด/จบ · Enter = ข้อต่อไป — ทำงานเมื่อไม่ได้โฟกัสที่ปุ่ม/ช่องกรอก
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = document.activeElement;
      if (el && el !== document.body) return;
      if (e.key === " " && !done && !selfReport) { e.preventDefault(); void onMic(); }
      else if (e.key === "Enter" && done) { e.preventDefault(); next(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (!item) return null;

  const chatWaiting = item.mode === "question" && chatRounds === 1 && !done && !selfReport;
  const finishChatNow = () => complete("correct", cueLevel, attempts + 1);
  const FbIcon = fb?.tone === "ok" ? CheckIcon : fb?.tone === "warn" ? AlertIcon : InfoIcon;
  const instruction = lang === "en" ? MODE_LABEL_EN[item.mode] : item.mode === "picture" ? "บอกชื่อสิ่งนี้" : MODE_LABEL[item.mode];
  // คำแปลช่วยผู้ใช้ภาษาอังกฤษ (เนื้อหา/เฉลย/เสียงยังเป็นไทย)
  const gloss = lang === "en" ? glossOf(item.text) : undefined;
  const hasFeedback = !!(cueText || fb || micError || heard || chat.length);

  return (
    <div className="fixed inset-0 z-30 overflow-hidden bg-[#f7faff]">
      <div className="mx-auto flex h-full w-full max-w-6xl flex-col gap-3 px-4 py-3 lg:gap-5 lg:px-8 lg:py-6">
        {env.length > 0 && (
          <div className="alert alert-warn shrink-0 !py-2 !text-base" role="alert">
            <AlertIcon />
            <div className="space-y-0.5">{env.map((m) => <p key={m}>{m}</p>)}</div>
          </div>
        )}

        {soundBlocked && (
          <button
            className="alert alert-info shrink-0 !items-center !py-3 text-left"
            onClick={async () => { if (await unlockAudio()) void speak(promptSpeech(item)); }}
          >
            <SpeakerIcon />
            <span>{tx({ th: "เบราว์เซอร์ปิดเสียงไว้ แตะที่นี่เพื่อเปิดเสียง", en: "Your browser is blocking sound. Tap here to turn it on." })}</span>
          </button>
        )}

        <header className="shrink-0 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <button className="flex min-h-12 items-center gap-1.5 rounded-xl px-2 text-base font-semibold text-sub hover:text-link" onClick={() => setConfirmExit(true)} aria-label={tx({ th: "ออกจากแบบฝึก", en: "Leave the exercise" })}>
              <ArrowLeftIcon /> {tx({ th: "ออก", en: "Exit" })}
            </button>
            <span className="text-base font-semibold text-sub lg:text-lg">{label}</span>
            <span className="min-w-14 text-right text-base font-semibold text-link lg:text-lg">{tx({ th: "ข้อ", en: "Q" })} {idx + 1}/{items.length}</span>
          </div>
          <Steps total={items.length} current={idx} label={label} />
        </header>

        {confirmExit && (
          <div className="alert alert-info shrink-0 flex-col !items-stretch" role="alertdialog" aria-label={tx({ th: "ยืนยันการออก", en: "Confirm exit" })}>
            <p>{tx({ th: "ออกตอนนี้ ความคืบหน้าของรอบนี้จะไม่ถูกบันทึก ออกเลยไหม", en: "If you leave now, this round's progress won't be saved. Leave anyway?" })}</p>
            <div className="grid grid-cols-2 gap-3 lg:max-w-md">
              <button className="btn btn-primary" onClick={() => setConfirmExit(false)}>{tx({ th: "ทำต่อ", en: "Keep going" })}</button>
              <button className="btn btn-line" onClick={() => router.push("/home")}>{tx({ th: "ออก", en: "Leave" })}</button>
            </div>
          </div>
        )}

        <div className="grid min-h-0 flex-1 grid-rows-[minmax(0,1fr)_auto] gap-3 lg:grid-cols-[minmax(0,1fr)_25rem] lg:grid-rows-1 lg:gap-6">
          {/* โจทย์ */}
          <section key={item.id} className="card rise flex min-h-0 flex-col items-center justify-center gap-3 overflow-y-auto p-4 text-center lg:gap-5 lg:p-8" aria-live="polite">
            <span className="shrink-0 rounded-full bg-soft px-4 py-1.5 text-base font-semibold text-link lg:text-lg">{instruction}</span>

            {item.mode === "picture" && item.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={item.image} alt={item.alt ?? tx({ th: "รูปภาพ", en: "Picture" })} className="min-h-0 w-full max-w-[34rem] flex-1 rounded-2xl object-contain" />
            )}
            {item.mode === "describe" && <p className="text-3xl font-bold leading-snug lg:text-5xl lg:leading-snug">{item.description}</p>}
            {item.mode === "sentence" && <p className="text-4xl font-bold leading-snug lg:text-6xl lg:leading-snug">{item.text}</p>}
            {item.mode === "question" && <p className="text-3xl font-bold leading-snug lg:text-5xl lg:leading-snug">{item.text}</p>}

            {gloss && (
              <p className="shrink-0 rounded-2xl bg-soft px-4 py-2 text-lg text-link lg:text-xl">
                <span className="font-semibold">{gloss[0]}</span>
                {gloss[1] && <span className="text-sub"> · {gloss[1]}</span>}
              </p>
            )}

            <button className="btn btn-ghost !w-auto shrink-0 px-6" onClick={() => speak(promptSpeech(item), { id: item.id })}>
              <SpeakerIcon /> {tx({ th: "ฟังอีกครั้ง", en: "Listen again" })}
            </button>
          </section>

          {/* คำตอบ + ปุ่มควบคุม */}
          <aside className="flex min-h-0 flex-col gap-3 lg:rounded-3xl lg:border-2 lg:border-line lg:bg-white lg:p-5 lg:shadow-[var(--shadow)]">
            <div className="max-h-[26dvh] min-h-0 space-y-3 overflow-y-auto lg:max-h-none lg:flex-1" aria-live="polite">
              {chat.length > 0 && (
                <div className="w-full space-y-2 text-left text-lg">
                  {chat.map((t, i) => (
                    <p key={i} className={t.role === "coach" ? "rounded-2xl bg-soft p-3 text-link" : "ml-6 rounded-2xl border-2 border-line bg-white p-3 text-sub"}>
                      <span className="mb-0.5 block text-sm font-semibold opacity-80">{t.role === "coach" ? tx({ th: "โค้ช", en: "Coach" }) : tx({ th: "คุณ", en: "You" })}</span>
                      {t.text}
                    </p>
                  ))}
                </div>
              )}
              {cueText && (
                <div className="alert alert-info rise" role="status">
                  <BulbIcon />
                  <div>
                    <span className="block text-sm opacity-80">{tx({ th: `คำใบ้ ${cueLevel} จาก 3`, en: `Hint ${cueLevel} of 3` })}</span>
                    {cueText}
                  </div>
                </div>
              )}
              {fb && (!chat.length || fb.tone === "warn") && (
                <p role="status" className={`alert pop ${fb.tone === "ok" ? "alert-ok" : fb.tone === "warn" ? "alert-warn" : "alert-info"}`}>
                  <FbIcon /> <span>{fb.text}</span>
                </p>
              )}
              {micError && <p role="alert" className="alert alert-warn"><AlertIcon /> <span>{micError}</span></p>}
              {heard && !done && <p className="text-base text-muted">{tx({ th: "ได้ยินว่า", en: "Heard" })} “{heard}”</p>}

              {/* เดสก์ท็อป: ยังไม่มีอะไรให้แสดง → บอกวิธีตอบ */}
              {!hasFeedback && (
                <ol className="hidden space-y-3 text-lg text-sub lg:block">
                  <li className="flex items-center gap-3"><span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-soft font-bold text-link">1</span> {tx({ th: "ดูโจทย์ หรือแตะ “ฟังอีกครั้ง”", en: "Look at the prompt, or tap “Listen again”" })}</li>
                  <li className="flex items-center gap-3"><span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-soft font-bold text-link">2</span> {tx({ th: "แตะปุ่มไมค์ แล้วพูดได้เลย", en: "Tap the mic and say it in Thai" })}</li>
                  <li className="flex items-center gap-3"><span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-soft font-bold text-link">3</span> {tx({ th: "พูดจบแล้วหยุด ระบบตรวจให้เอง", en: "Stop talking when you're done — it checks automatically" })}</li>
                </ol>
              )}
            </div>

            <div className="shrink-0 space-y-3">
              {!done && !selfReport && !chatWaiting && (
                <>
                  <button
                    onClick={onMic}
                    disabled={busy}
                    aria-pressed={recording}
                    className={`btn btn-primary ${recording ? "recording" : ""}`}
                    style={{ minHeight: "clamp(4.5rem, 11dvh, 6rem)", fontSize: "1.5rem" }}
                  >
                    {busy ? (<><span className="spinner" /> {tx({ th: "กำลังตรวจคำตอบ…", en: "Checking your answer…" })}</>)
                      : recording ? (<><span className="bars" aria-hidden><i /><i /><i /><i /></span> {tx({ th: "กำลังฟัง พูดได้เลย", en: "Listening — speak now" })}</>)
                      : cueLevel >= 3 ? (<><MicIcon /> {tx({ th: "แตะแล้วพูดตาม", en: "Tap and repeat" })}</>)
                      : (<><MicIcon /> {tx({ th: "แตะแล้วพูด", en: "Tap and speak" })}</>)}
                  </button>
                  <div className="grid grid-cols-2 gap-3">
                    <button className="btn btn-ghost" disabled={busy || recording || cueLevel >= 3} onClick={askCue}>
                      <BulbIcon /> {tx({ th: "ขอคำใบ้", en: "Hint" })}{cueLevel > 0 ? ` (${cueLevel}/3)` : ""}
                    </button>
                    <button className="btn btn-line" disabled={busy || recording} onClick={() => complete("skipped")}>
                      <SkipIcon /> {tx({ th: "ข้ามข้อนี้", en: "Skip" })}
                    </button>
                  </div>
                  <p className="hidden text-center text-sm text-muted lg:block">{recording ? tx({ th: "พูดจบแล้วหยุดสักครู่ ระบบจะตัดให้เอง", en: "Pause when you're done — it will stop by itself" }) : tx({ th: "ทางลัด: กด Space เพื่อเริ่มพูด", en: "Shortcut: press Space to start" })}</p>
                </>
              )}

              {selfReport && (
                <div className="grid grid-cols-2 gap-3">
                  <button className="btn btn-ok" onClick={() => complete("correct")}><CheckIcon /> {tx({ th: "ฉันตอบได้", en: "I got it" })}</button>
                  <button className="btn btn-line" onClick={() => complete("skipped")}><SkipIcon /> {tx({ th: "ข้ามข้อนี้", en: "Skip" })}</button>
                </div>
              )}

              {chatWaiting && (
                <div className="grid grid-cols-2 gap-3">
                  <button className={`btn btn-primary ${recording ? "recording" : ""}`} onClick={onMic} disabled={busy}>
                    {recording ? (<><span className="bars" aria-hidden><i /><i /><i /><i /></span> {tx({ th: "กำลังฟัง", en: "Listening" })}</>) : (<><MicIcon /> {tx({ th: "ตอบต่อ", en: "Reply" })}</>)}
                  </button>
                  <button className="btn btn-line" disabled={busy || recording} onClick={finishChatNow}>{tx({ th: "พอแล้ว", en: "That's enough" })}</button>
                </div>
              )}

              {done && (
                <>
                  <button className="btn btn-primary rise" style={{ minHeight: "clamp(4.5rem, 11dvh, 6rem)", fontSize: "1.5rem" }} onClick={next} autoFocus>
                    {idx + 1 >= items.length ? tx({ th: "จบแล้ว ดูผล", en: "Finish and see results" }) : tx({ th: "ข้อต่อไป", en: "Next" })} <ArrowRightIcon />
                  </button>
                  <p className="hidden text-center text-sm text-muted lg:block">{tx({ th: "ทางลัด: กด Enter", en: "Shortcut: press Enter" })}</p>
                </>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
