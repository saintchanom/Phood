import { ask, CHAT_MODEL, hasClaude, parseJson } from "@/lib/claude";
import { findItem } from "@/lib/items";
import { limited, tooMany } from "@/lib/ratelimit";

type Body = {
  itemId: string;
  transcript: string;
  history?: { role: "coach" | "user"; text: string }[];
  round: number; // 1..2
};

// ใช้เฉพาะตอน LLM ใช้ไม่ได้จริงๆ — สุ่มให้ไม่ซ้ำกันทุกครั้ง
const FALLBACK = ["ขอบคุณที่เล่าให้ฟังนะ เก่งมากเลย", "ฟังแล้วน่าสนใจจัง เล่าต่อได้เลยนะ", "ดีจังเลย ขอบคุณที่เล่านะ", "เข้าใจแล้ว เก่งมากที่เล่าให้ฟัง"];
// สุ่มมุมการตอบเพื่อไม่ให้คำตอบเดิมออกมาซ้ำแม้ผู้ป่วยตอบเหมือนเดิม
const ANGLES = [
  "ชวนนึกถึงรสชาติหรือกลิ่น",
  "ถามว่าใครเป็นคนทำหรือซื้อมา",
  "ถามว่ากินตอนไหนหรือที่ไหน",
  "พูดถึงความรู้สึกหรือความทรงจำที่เกี่ยวกับสิ่งนั้น",
  "ถามว่าชอบเพราะอะไร",
  "เล่าเสริมสั้นๆ ว่าสิ่งนั้นน่าสนใจอย่างไร แล้วถามความเห็น",
];
const pick = () => FALLBACK[Math.floor(Math.random() * FALLBACK.length)];

// โหมดคุยกับโค้ช: LLM ตัดสินว่าตอบเกี่ยวข้องไหม + คิดคำพูดตอบกลับจากสิ่งที่ผู้ฝึกพูดจริง (ไม่ใช้แพตเทิร์นสำเร็จรูป)
export async function POST(req: Request) {
  if (limited(req, "chat", 30)) return tooMany();
  let body: Body;
  try { body = (await req.json()) as Body; } catch { return Response.json({ error: "bad_json" }, { status: 400 }); }
  const item = findItem(body.itemId);
  if (!item || item.mode !== "question") return Response.json({ error: "unknown_item" }, { status: 400 });
  const question = item.text;
  const round = Number(body.round) || 1;
  // จำกัดขนาดข้อมูลที่ส่งเข้า LLM (กันค่าใช้จ่ายและการยัดคำสั่ง)
  const history = (Array.isArray(body.history) ? body.history : []).slice(-4).map((h) => ({
    role: h?.role === "coach" ? ("coach" as const) : ("user" as const),
    text: String(h?.text ?? "").slice(0, 300),
  }));
  const last = round >= 2;
  const heard = String(body.transcript ?? "").trim().slice(0, 300);
  const relevantGuess = heard.length >= 2;
  if (!hasClaude()) return Response.json({ relevant: relevantGuess, reply: pick() });

  const system = [
    "คุณคือโค้ชฝึกพูดที่อบอุ่นเหมือนเพื่อนคุยกับผู้สูงอายุที่กำลังฝึกพูดหลังโรคหลอดเลือดสมอง คุยเป็นภาษาไทย",
    "หลักการตอบ:",
    "- อ้างอิงถึงคำที่ผู้ฝึกพูดจริงๆ (เช่น ถ้าตอบว่า ผัดกะเพรา ให้พูดถึงผัดกะเพรา) ห้ามตอบกว้างๆ ที่ใช้ได้กับทุกคำตอบ เช่น เก่งมาก ขอบคุณที่เล่า",
    "- ห้ามใช้ประโยคซ้ำกับที่โค้ชเคยพูดมาก่อนในบทสนทนา และห้ามขึ้นต้นเหมือนเดิม ให้เปลี่ยนคำและมุมมองทุกครั้ง",
    last
      ? "- นี่คือรอบสุดท้าย: ตอบรับสิ่งที่ผู้ฝึกเพิ่งเล่า แล้วปิดบทสนทนาอย่างอบอุ่น ไม่ต้องถามต่อ"
      : "- ตอบรับสั้นๆ ต่อสิ่งที่เล่า แล้วถามต่อ 1 คำถามที่เกี่ยวกับคำตอบนั้นโดยตรง (เช่น รสชาติ ใครทำให้ ชอบเพราะอะไร) ตอบได้ง่ายด้วยคำเดียวหรือวลีสั้นๆ",
    "- ใช้ประโยคสั้น คำง่าย ไม่เกิน 2 ประโยค ไม่ใช้ภาษาทางการหรือศัพท์ยาก",
    "- ข้อความผู้ฝึกมาจากการถอดเสียง อาจเพี้ยนหรือไม่ครบ ให้เดาความหมายอย่างใจกว้าง ห้ามแก้คำพูดหรือบอกว่าผิด ห้ามวินิจฉัย ห้ามใช้คำว่า ผิด หรือ ตก",
    "- ไม่ใช้คำลงท้าย ครับ/ค่ะ/คะ ใช้ น้า/นะ/จัง ได้ ไม่ใช้อีโมจิ",
    'ตอบเป็น JSON บรรทัดเดียวเท่านั้น: {"relevant":true|false,"reply":"..."} โดย relevant = สิ่งที่ผู้ฝึกพูดเกี่ยวข้องกับคำถามไหม (ตอบสั้นๆ ก็ถือว่าเกี่ยวข้อง)',
  ].join("\n");

  const convo = history.map((h) => `${h.role === "coach" ? "โค้ช" : "ผู้ฝึก"}: ${h.text}`).join("\n");
  const angle = ANGLES[Math.floor(Math.random() * ANGLES.length)];
  const user = `(มุมการตอบรอบนี้: ${last ? "ปิดอย่างอบอุ่น" : angle})\nคำถามแรกของโค้ช: ${question}\n${convo ? convo + "\n" : ""}ผู้ฝึกพูดล่าสุด (ถอดเสียง): "${heard}"`;
  try {
    const out = await ask(CHAT_MODEL, system, user, 200, 0.9);
    const j = parseJson<{ relevant?: boolean; reply?: string }>(out);
    if (j?.reply) return Response.json({ relevant: j.relevant !== false, reply: j.reply.trim() });
  } catch {}
  return Response.json({ relevant: relevantGuess, reply: pick() });
}
