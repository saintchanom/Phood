// ที่เก็บข้อมูลฝั่งเบราว์เซอร์ (MVP) — เปลี่ยนเป็น Supabase ได้โดยแก้ไฟล์นี้ไฟล์เดียว (ดู supabase/schema.sql)
import { INITIAL } from "./rules";
import type { Progress } from "./types";

export type User = { id: string; name: string; email?: string; picture?: string; guest?: boolean };

const K_USER = "aphasia.user";
const K_PROGRESS = "aphasia.progress"; // + "." + user id (แยกความคืบหน้าตามผู้ใช้)
const K_CONSENT = "aphasia.consent";

function get<T>(key: string): T | null {
  try { const v = localStorage.getItem(key); return v ? (JSON.parse(v) as T) : null; } catch { return null; }
}
function set(key: string, v: unknown) {
  try { localStorage.setItem(key, JSON.stringify(v)); } catch {}
}
function remove(key: string) {
  try { localStorage.removeItem(key); } catch {}
}

const progressKey = () => `${K_PROGRESS}.${get<User>(K_USER)?.id ?? "anon"}`;

export const store = {
  getUser: () => get<User>(K_USER),
  setUser: (u: User | null) => (u ? set(K_USER, u) : remove(K_USER)),
  // การออกจากระบบแค่ลบ user — ความคืบหน้าของแต่ละคนยังอยู่ใต้คีย์ของตัวเอง
  getProgress: (): Progress => {
    const p: Progress = { ...INITIAL, ...(get<Progress>(progressKey()) ?? get<Progress>(K_PROGRESS) ?? {}) };
    // ค่าที่เสียหาย/นอกช่วง (เช่น ด่านไม่ใช่ 1–5) ปรับกลับเข้าช่วง ไม่ให้เปิดด่านที่ไม่มีอยู่
    const level = ([1, 2, 3].includes(p.level) ? p.level : 1) as Progress["level"];
    const stage = Math.min(5, Math.max(1, Math.floor(Number(p.stage) || 1)));
    return { ...p, level, stage, repeatIds: Array.isArray(p.repeatIds) ? p.repeatIds : [], history: Array.isArray(p.history) ? p.history : [] };
  },
  setProgress: (p: Progress) => set(progressKey(), p),
  hasConsent: () => get<boolean>(K_CONSENT) === true,
  setConsent: () => set(K_CONSENT, true),
  reset: () => remove(progressKey()),
};
