import { allItems } from "./content";
import { PLACEMENT } from "./placement";
import type { Item } from "./types";

const byId = new Map<string, Item>([...allItems, ...PLACEMENT].map((i) => [i.id, i]));

/** ค้นข้อจาก id ฝั่ง server — ไม่เชื่อ accept/text ที่ client ส่งมา */
export const findItem = (id: unknown): Item | undefined => (typeof id === "string" ? byId.get(id) : undefined);
