import { ITEMS } from "./content.generated";
import type { Item, Level } from "./types";

// ข้อรูปภาพที่ยังไม่มีรูปจริง (ระดับ 2–3 รอรูปเพิ่ม) ไม่นำมาใช้
export const allItems = ITEMS.filter((i) => i.mode !== "picture" || !!i.image);

export function stageItems(level: Level, stage: number): Item[] {
  return allItems.filter((i) => i.level === level && i.stage === stage);
}

/** ลำดับในด่าน: รูปภาพ → คำอธิบาย → ประโยค → ตอบคำถาม */
const ORDER = { picture: 0, describe: 1, sentence: 2, question: 3 } as const;
const MAX_REPEATS = 5;
export function stageSession(level: Level, stage: number, repeatIds: string[] = []): Item[] {
  const base = stageItems(level, stage);
  const inBase = new Set(base.map((i) => i.id));
  // ข้อที่เคยฝึกพูดตามจากด่านก่อนหน้า กลับมาทำอีก (สูงสุด MAX_REPEATS ข้อ)
  const repeats = repeatIds
    .map((id) => allItems.find((i) => i.id === id))
    .filter((i): i is Item => !!i && !inBase.has(i.id))
    .slice(0, MAX_REPEATS);
  return [...base, ...repeats].sort((a, b) => ORDER[a.mode] - ORDER[b.mode]);
}

export const MODE_LABEL = {
  picture: "บอกชื่อสิ่งนี้",
  describe: "ฟังคำใบ้ แล้วบอกว่าคืออะไร",
  sentence: "พูดตามประโยค",
  question: "คุยกับโค้ช",
} as const;

export const MODE_LABEL_EN = {
  picture: "Say this in Thai",
  describe: "Listen to the Thai clue, then say the word in Thai",
  sentence: "Repeat this Thai sentence",
  question: "Chat with the coach (in Thai)",
} as const;
