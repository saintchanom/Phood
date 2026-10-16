import { ask, CHAT_MODEL, hasClaude } from "@/lib/claude";
import { limited, tooMany } from "@/lib/ratelimit";

// ข้อความสรุปผลระดับการฝึก (ให้กำลังใจ ไม่วินิจฉัย) — ระดับตัดสินด้วยกฎใน lib/placement.ts
export async function POST(req: Request) {
  if (limited(req, "placement", 15)) return tooMany();
  let body: { level?: number; passed?: number; total?: number; seeDoctor?: boolean; lang?: string };
  try { body = await req.json(); } catch { return Response.json({ error: "bad_json" }, { status: 400 }); }
  const level = ([1, 2, 3].includes(Number(body.level)) ? Number(body.level) : 1) as 1 | 2 | 3;
  const total = Math.min(100, Math.max(0, Math.floor(Number(body.total) || 0)));
  const passed = Math.min(total, Math.max(0, Math.floor(Number(body.passed) || 0)));
  const seeDoctor = body.seeDoctor === true;
  const en = body.lang === "en";
  const fallback = en
    ? level === 1 ? "We'll start with easy, gentle exercises. A little each day goes a long way."
      : level === 2 ? "You did well on several questions. We'll start at an intermediate level — steady practice keeps improving things."
      : "You did very well. We'll start at a slightly more challenging level."
    : level === 1 ? "เราจะเริ่มจากแบบฝึกที่ง่ายและค่อยเป็นค่อยไป ทำทีละนิดทุกวันนะ"
    : level === 2 ? "คุณทำได้ดีหลายข้อ เราจะเริ่มจากแบบฝึกระดับกลาง ฝึกต่อเนื่องจะดีขึ้นเรื่อยๆ"
    : "คุณทำได้ดีมาก เราจะเริ่มจากแบบฝึกระดับที่ท้าทายขึ้นนิดหน่อย";
  if (!hasClaude()) return Response.json({ message: fallback });
  try {
    const system = en
      ? "Write a short 1–2 sentence encouraging summary in English for a person practising Thai speech. Do not diagnose, do not mention severity of any condition, do not say failed or wrong."
      : "เขียนข้อความสรุปผลสั้นๆ 1–2 ประโยคเป็นภาษาไทย ให้กำลังใจผู้ป่วยที่กำลังฝึกพูด ห้ามวินิจฉัย ห้ามพูดถึงความรุนแรงของโรค ห้ามใช้คำว่าตก/ผิด ไม่ใช้ครับ/ค่ะ";
    const msg = await ask(CHAT_MODEL, system, `ผลแบบทดสอบ: ผ่าน ${passed} จาก ${total} ข้อ จัดอยู่ระดับการฝึก ${level} จาก 3${seeDoctor ? " (ไม่ต้องพูดถึงแพทย์ จะมีข้อความแยก)" : ""}`, 150);
    return Response.json({ message: msg.trim() || fallback });
  } catch {
    return Response.json({ message: fallback });
  }
}
