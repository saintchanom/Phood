"use client";
import { useEffect, useRef, useState } from "react";

// โหมดในเครื่อง (ค่าเริ่มต้น): ใช้ Web Speech API ของเบราว์เซอร์ ไม่เรียก API ภายนอกของเรา
// ตั้ง NEXT_PUBLIC_LOCAL_MODE=false เพื่อใช้ MediaRecorder + ElevenLabs Scribe ผ่าน /api/transcribe
export const LOCAL_MODE = process.env.NEXT_PUBLIC_LOCAL_MODE !== "false";

// ตัดการอัดอัตโนมัติเมื่อผู้ใช้พูดจบ (ไม่ต้องกดหยุด) — เผื่อช่วงเงียบนานขึ้นสำหรับผู้ที่พูดช้า
const SILENCE_MS = 2000;      // เงียบต่อเนื่องหลังเริ่มพูด = พูดจบ
const NO_SPEECH_MS = 8000;    // ไม่มีเสียงพูดเลย = ตัดให้ (ขึ้นว่าได้ยินไม่ชัด)
const MAX_MS = 25000;         // เพดานความยาวต่อครั้ง
const MIN_VOICE_MS = 250;     // เสียงต้องต่อเนื่องเท่านี้จึงนับว่าเริ่มพูด (กันเสียงกระแทก)

export type Captured = { blob?: Blob; text?: string };

type SR = {
  lang: string; continuous: boolean; interimResults: boolean; maxAlternatives: number;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void; stop: () => void; abort: () => void;
};

function pickMime(): string | undefined {
  if (typeof MediaRecorder === "undefined") return undefined;
  for (const m of ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"]) {
    if (MediaRecorder.isTypeSupported(m)) return m;
  }
  return undefined;
}

export function speechRecognitionSupported(): boolean {
  if (typeof window === "undefined") return false;
  const w = window as unknown as Record<string, unknown>;
  return !!(w.SpeechRecognition || w.webkitSpeechRecognition);
}

export function useRecorder() {
  const [recording, setRecording] = useState(false);
  const rec = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const stream = useRef<MediaStream | null>(null);
  const resolveStop = useRef<((c: Captured) => void) | null>(null);
  const sr = useRef<SR | null>(null);
  const srText = useRef("");
  const srEnded = useRef(false);
  const srError = useRef("");
  const lastResultAt = useRef(0);
  const stopTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const vad = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioCtx = useRef<AudioContext | null>(null);
  const [autoStopped, setAutoStopped] = useState(false); // true = ตรวจพบว่าพูดจบ/เงียบ ให้ผู้ใช้ฝั่งนอกเรียก stop()

  function clearStopTimer() {
    if (stopTimer.current) clearTimeout(stopTimer.current);
    stopTimer.current = null;
  }
  function clearVad() {
    if (vad.current) clearInterval(vad.current);
    vad.current = null;
  }
  // ผู้ตรวจจับ: เรียก voiceNow() ทุกรอบ แล้วตัดสินใจว่าพูดจบหรือยัง
  function watch(voiceNow: () => boolean) {
    clearVad();
    const t0 = Date.now();
    let voiceStart = 0, heard = false, lastVoice = 0;
    vad.current = setInterval(() => {
      const now = Date.now();
      if (voiceNow()) {
        if (!voiceStart) voiceStart = now;
        lastVoice = now;
        if (now - voiceStart >= MIN_VOICE_MS) heard = true;
      } else if (!heard) {
        voiceStart = 0;
      }
      const silentFor = now - lastVoice;
      if ((heard && silentFor >= SILENCE_MS) || (!heard && now - t0 >= NO_SPEECH_MS) || now - t0 >= MAX_MS) {
        clearVad();
        setAutoStopped(true);
      }
    }, 150);
  }
  function releaseStream() {
    stream.current?.getTracks().forEach((t) => t.stop());
    stream.current = null;
    void audioCtx.current?.close().catch(() => {});
    audioCtx.current = null;
  }

  // ออกจากหน้า/เปลี่ยนข้อ: ปิดไมค์ทุกแบบ ไม่ให้ค้างอยู่เบื้องหลัง
  useEffect(() => () => {
    clearStopTimer();
    clearVad();
    resolveStop.current = null;
    if (sr.current) {
      sr.current.onend = null; sr.current.onresult = null; sr.current.onerror = null;
      try { sr.current.abort(); } catch {}
      sr.current = null;
    }
    if (rec.current) {
      rec.current.onstop = null;
      try { if (rec.current.state !== "inactive") rec.current.stop(); } catch {}
      rec.current = null;
    }
    releaseStream();
  }, []);

  async function start() {
    clearStopTimer();
    setAutoStopped(false);
    if (LOCAL_MODE) {
      if (!speechRecognitionSupported()) throw new Error("no_speech_recognition");
      const w = window as unknown as Record<string, new () => SR>;
      const r = new (w.SpeechRecognition || w.webkitSpeechRecognition)();
      r.lang = "th-TH";
      r.continuous = true;
      r.interimResults = true; // ใช้จับจังหวะว่ากำลังพูดอยู่
      r.maxAlternatives = 1;
      srText.current = ""; srEnded.current = false; srError.current = "";
      r.onresult = (e) => {
        let t = "";
        for (let i = 0; i < e.results.length; i++) t += e.results[i][0].transcript;
        srText.current = t;
        lastResultAt.current = Date.now();
      };
      r.onerror = (e) => { srError.current = e.error; };
      r.onend = () => {
        srEnded.current = true;
        clearStopTimer();
        clearVad();
        if (resolveStop.current) {
          resolveStop.current({ text: srText.current.trim() });
          resolveStop.current = null;
        } else {
          setAutoStopped(true); // เบราว์เซอร์ปิดการฟังเอง (เงียบนาน) → ให้ฝั่งนอกส่งต่อ
        }
      };
      lastResultAt.current = 0;
      r.start();
      // เสียงพูดล่าสุดภายใน 700ms = ยังพูดอยู่ (ผลถอดเสียงมาเป็นช่วงๆ)
      watch(() => Date.now() - lastResultAt.current < 700);
      sr.current = r;
      setRecording(true);
      return;
    }
    const s = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
    stream.current = s;
    try {
      const mime = pickMime();
      const r = new MediaRecorder(s, mime ? { mimeType: mime } : undefined);
      chunks.current = [];
      r.ondataavailable = (e) => e.data.size && chunks.current.push(e.data);
      r.onstop = () => {
        releaseStream();
        resolveStop.current?.({ blob: new Blob(chunks.current, { type: r.mimeType || "audio/webm" }) });
        resolveStop.current = null;
      };
      r.start();
      rec.current = r;
      setRecording(true);
      // ตรวจระดับเสียงจากไมค์ (RMS) เทียบกับเสียงรอบข้างที่วัดตอนเริ่ม
      try {
        const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        const ctx = new AC();
        void ctx.resume();
        audioCtx.current = ctx;
        const an = ctx.createAnalyser();
        an.fftSize = 1024;
        ctx.createMediaStreamSource(s).connect(an);
        const buf = new Float32Array(an.fftSize);
        let frames = 0, noise = 0;
        watch(() => {
          an.getFloatTimeDomainData(buf);
          let sum = 0;
          for (let i = 0; i < buf.length; i++) sum += buf[i] * buf[i];
          const rms = Math.sqrt(sum / buf.length);
          if (frames < 4) { noise += rms / 4; frames++; return false; } // ~0.6 วินาทีแรกใช้วัดเสียงรอบข้าง
          return rms > Math.min(0.06, Math.max(0.02, noise * 2.5));
        });
      } catch {
        // ตรวจจับอัตโนมัติไม่ได้ (เบราว์เซอร์ไม่รองรับ) → ผู้ใช้กดปุ่มเพื่อจบเอง
      }
    } catch (e) {
      releaseStream();
      throw e;
    }
  }

  function stop(): Promise<Captured> {
    return new Promise((resolve) => {
      clearVad();
      setRecording(false);
      if (LOCAL_MODE) {
        if (srEnded.current) return resolve({ text: srText.current.trim() });
        resolveStop.current = resolve;
        try { sr.current?.stop(); } catch { resolveStop.current = null; return resolve({ text: srText.current.trim() }); }
        // กันเบราว์เซอร์ที่ไม่ยิง onend
        clearStopTimer();
        stopTimer.current = setTimeout(() => {
          stopTimer.current = null;
          resolveStop.current?.({ text: srText.current.trim() });
          resolveStop.current = null;
        }, 2500);
        return;
      }
      const r = rec.current;
      if (!r || r.state === "inactive") return resolve({ blob: new Blob(chunks.current, { type: "audio/webm" }) });
      resolveStop.current = resolve;
      r.stop();
    });
  }

  return { recording, autoStopped, start, stop, lastError: () => srError.current };
}
