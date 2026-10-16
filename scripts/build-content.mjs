// แปลง ../product/content-bank.md -> lib/content.generated.ts
// รัน: node scripts/build-content.mjs
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const src = path.resolve(here, "../../product/content-bank.md");
const out = path.resolve(here, "../lib/content.generated.ts");

// รูปภาพ: อ่านจากโฟลเดอร์ picture_naming_level<N>_colorful (ชื่อไฟล์ pn-l<L>-s<S>-<NN>_<คำ>.png + image_prompts.json)
// ย่อเป็น JPEG 640px ไว้ที่ public/pictures/<item id>.jpg แล้วผูกกับข้อ picture ที่ level/stage/ลำดับตรงกัน
const root = path.resolve(here, "..");
const picDir = path.join(root, "public/pictures");
fs.mkdirSync(picDir, { recursive: true });
// ชื่อไฟล์ (l1/s1…) ไม่ได้บอกระดับจริง — ใช้เป็นแค่ลำดับความยากง่าย แล้วกระจายรูปทั้งหมดไปยังระดับ 1–3 / ด่าน 1–5
const PICS = []; // { key, image, alt, word }
for (const dir of fs.readdirSync(root).filter((d) => /^picture_naming_level\d+_colorful$/.test(d))) {
  const prompts = {};
  const pj = path.join(root, dir, "image_prompts.json");
  if (fs.existsSync(pj)) for (const p of JSON.parse(fs.readFileSync(pj, "utf8"))) prompts[p.id] = p;
  for (const f of fs.readdirSync(path.join(root, dir))) {
    const m = f.match(/^pn-l(\d)-s(\d)-(\d\d)_(.+)\.png$/);
    if (!m) continue;
    const id = `pn-l${m[1]}-s${m[2]}-${m[3]}`;
    const dest = path.join(picDir, `${id}.jpg`);
    if (!fs.existsSync(dest)) {
      execFileSync("sips", ["-Z", "640", "-s", "format", "jpeg", "-s", "formatOptions", "80", path.join(root, dir, f), "--out", dest], { stdio: "ignore" });
    }
    const subject = prompts[`pn-l${m[1]}-s${m[2]}-${m[3]}`]?.image_prompt?.match(/Subject: (.*?)\. Color direction/)?.[1];
    PICS.push({ key: `${m[1]}${m[2]}${m[3]}`, image: `/pictures/${id}.jpg`, alt: subject ?? m[4], word: m[4] });
  }
}

const DESC = {
  หมอน: "ใช้หนุนหัวตอนนอน", ผ้าม่าน: "แขวนที่หน้าต่าง ไว้บังแดดและบังตา", กระจก: "ใช้ส่องดูหน้าตัวเอง",
  สบู่: "ใช้ถูตัวตอนอาบน้ำให้สะอาด", แชมพู: "ใช้สระผม", หลอดไฟ: "ติดบนเพดาน เปิดแล้วสว่าง",
  พรม: "ปูบนพื้น ไว้เช็ดเท้าหรือนั่ง", กาต้มน้ำ: "ใช้ต้มน้ำให้เดือด", ไม้ถูพื้น: "ใช้ถูพื้นให้สะอาด",
  ที่นอน: "ปูบนเตียง ไว้นอน",
  รีโมท: "ใช้กดเปลี่ยนช่องทีวีจากระยะไกล", แอร์: "ทำให้ห้องเย็น", โต๊ะ: "ใช้วางของหรือนั่งกินข้าว มีสี่ขา",
  ตะหลิว: "ใช้พลิกอาหารในกระทะ", ผงซักฟอก: "ใช้ซักผ้าให้สะอาด", ไม้ขีด: "ใช้จุดไฟ ขีดแล้วเกิดไฟ",
  เทียน: "จุดไฟให้แสงสว่าง ละลายได้", ปลั๊กไฟ: "ใช้เสียบสายไฟต่ออุปกรณ์", ถาด: "ใช้ใส่จานอาหารยกไปเสิร์ฟ",
  ขวด: "ใส่น้ำ มีฝาปิด คอเรียว",
  ตลาด: "ที่คนไปซื้อผักและเนื้อ มีแม่ค้าเยอะ", วัด: "ที่พระอยู่ คนไปทำบุญ", โรงพยาบาล: "ที่คนป่วยไปหาหมอ",
  หมอ: "คนที่ตรวจรักษาคนป่วย", พระ: "ผู้ชายห่มจีวรสีเหลืองหรือสีส้ม", ธนาคาร: "ที่ฝากและถอนเงิน",
  แม่ค้า: "คนที่ขายของในตลาด", ไปรษณีย์: "ที่ส่งจดหมายและพัสดุ", ร้านขายยา: "ที่ไปซื้อยา มีเภสัชกร",
  มอเตอร์ไซค์: "ยานพาหนะสองล้อ มีเครื่องยนต์",
  ตุ๊กตุ๊ก: "รถสามล้อเครื่อง วิ่งรับจ้าง", เรือ: "ลอยในน้ำ ใช้ข้ามแม่น้ำ", เครื่องบิน: "บินในอากาศ พาคนไปไกลๆ",
  โรงเรียน: "ที่เด็กไปเรียนหนังสือ", ครู: "คนที่สอนหนังสือ", ชาวนา: "คนที่ปลูกข้าว", ตู้เอทีเอ็ม: "ใช้กดเงินสดจากบัตร",
  สวนสาธารณะ: "ที่มีต้นไม้ คนไปเดินเล่นออกกำลังกาย", ปั๊มน้ำมัน: "ที่เติมน้ำมันรถ", ห้าง: "ตึกใหญ่ มีร้านค้าหลายร้าน ปรับอากาศเย็น",
  ไม้บรรทัด: "ใช้วัดความยาว ขีดเส้นตรง", ตะปู: "โลหะปลายแหลม ใช้ตอกไม้", ค้อน: "ใช้ตอกตะปู",
  กระด้ง: "ภาชนะสานกลมแบน ใช้ฝัดข้าวหรือตากของ", ครก: "ใช้ตำพริกหรือส้มตำ ใช้คู่กับสาก", มุ้ง: "กางตอนนอน กันยุง",
  หมวกกันน็อก: "ใส่ตอนขี่มอเตอร์ไซค์ กันหัวกระแทก", ถังแก๊ส: "ใช้ทำอาหาร ต่อกับเตา", พัด: "โบกให้ลมเย็น ใช้มือถือ",
  ตะเกียง: "ใช้ส่องสว่างตอนไม่มีไฟฟ้า ใช้น้ำมัน",
  ด้าย: "เส้นเล็กๆ ใช้เย็บผ้า", กระดุม: "ติดเสื้อ ไว้ติดเสื้อเข้าด้วยกัน", ซิป: "อยู่ที่กางเกงหรือกระเป๋า รูดขึ้นลง",
  กระถาง: "ใช้ปลูกต้นไม้ ทำด้วยดินเผา", ผ้ากันเปื้อน: "สวมตอนทำอาหาร กันเปื้อน", ที่เปิดขวด: "ใช้เปิดฝาขวดน้ำอัดลม",
  หนังยาง: "ยืดได้ ใช้รัดของ", เชือก: "เส้นยาวๆ ใช้มัดของ", โอ่ง: "ภาชนะใหญ่ ใส่น้ำฝนไว้ใช้", ทัพพี: "ใช้ตักข้าวหรือตักแกง",
  สายยาง: "ท่อยางยาวๆ ใช้รดน้ำต้นไม้", ก๊อกน้ำ: "เปิดแล้วน้ำไหลออกมา", บันได: "ใช้ปีนขึ้นที่สูง มีขั้นๆ",
  ลิฟต์: "กดแล้วพาขึ้นลงตึก", ชักโครก: "อยู่ในห้องน้ำ ใช้นั่งถ่าย", ฝักบัว: "ติดผนังห้องน้ำ น้ำพุ่งลงมาเหมือนฝน",
  ผ้าขี้ริ้ว: "ผ้าเก่าๆ ใช้เช็ดพื้นหรือเช็ดของสกปรก", สวิตช์: "กดแล้วไฟเปิดหรือปิด", แจกัน: "ใส่ดอกไม้ไว้ประดับ",
  รั้ว: "ล้อมรอบบ้าน กันคนเข้า",
  คลินิก: "ที่ไปหาหมอ เล็กกว่าโรงพยาบาล", สนามบิน: "ที่เครื่องบินขึ้นและลง", ร้านทอง: "ที่ขายสร้อย แหวน สีเหลืองวาว",
  ทะเล: "น้ำเค็มกว้างใหญ่ มีคลื่นและหาดทราย", ภูเขา: "ที่สูงใหญ่ มีป่าไม้ อากาศเย็น", ทหาร: "คนใส่ชุดลายพราง ป้องกันประเทศ",
  นักร้อง: "คนที่ร้องเพลงบนเวที", เภสัชกร: "คนที่จัดยาให้ในร้านยา", ชาวสวน: "คนที่ปลูกผลไม้", ทนาย: "คนที่ว่าความในศาล",
  งานบวช: "ผู้ชายโกนผมไปเป็นพระ ครอบครัวมาร่วมงาน", สงกรานต์: "วันปีใหม่ไทย เดือนเมษายน สาดน้ำกัน",
  ลอยกระทง: "ปล่อยกระทงลงน้ำ ตอนพระจันทร์เต็มดวง", งานแต่งงาน: "เจ้าบ่าวเจ้าสาวจัดงานเลี้ยง",
  วันเกิด: "เป่าเค้ก ทุกปี", ปีใหม่: "วันที่ 1 มกราคม นับถอยหลัง", ตรุษจีน: "ได้อั่งเปา สีแดง ไหว้เจ้า",
  วันแม่: "วันที่ลูกๆ กราบแม่ เดือนสิงหาคม", ปิกนิก: "เอาอาหารไปนั่งกินกลางสวน", เข้าพรรษา: "พระอยู่ประจำวัดสามเดือนช่วงฝน",
  ความสุข: "ความรู้สึกดี ยิ้มได้ ใจเบิกบาน", วันหยุด: "วันที่ไม่ต้องทำงาน พักผ่อนได้",
  ความฝัน: "สิ่งที่เห็นตอนนอนหลับ หรือสิ่งที่อยากให้เป็นจริง", ความลับ: "เรื่องที่ไม่บอกใคร",
  ความรัก: "ความรู้สึกที่มีต่อคนในครอบครัวหรือคนสำคัญ", ความจำ: "ที่ช่วยให้เราจำเรื่องต่างๆ ได้",
  โชค: "สิ่งดีๆ ที่เกิดขึ้นโดยไม่คาดคิด เช่น ถูกลอตเตอรี่", เพื่อน: "คนที่สนิท คบกันมานาน ไว้คุยกัน",
  อนาคต: "เวลาที่ยังมาไม่ถึง พรุ่งนี้ ปีหน้า", ความหวัง: "ความรู้สึกที่รอคอยสิ่งดีๆ จะเกิดขึ้น",
};

const MODE = { รูปภาพ: "picture", "รูปภาพ (คำกริยา)": "picture", "รูปภาพ (กริยา)": "picture", คำอธิบาย: "describe", "คำอธิบาย (คำนามธรรม)": "describe", ประโยค: "sentence", ตอบคำถาม: "question" };

const lines = fs.readFileSync(src, "utf8").split("\n");
let level = 0, stage = 0;
const items = [];
const missing = { images: [], desc: [] };
const counters = {};
for (const raw of lines) {
  const l = raw.trim();
  let m;
  if ((m = l.match(/^## ระดับ (\d)/))) { level = +m[1]; continue; }
  if ((m = l.match(/^### ด่าน (\d)/))) { stage = +m[1]; continue; }
  if (!(m = l.match(/^- ([^:]+): (.+)$/))) continue;
  const mode = MODE[m[1].trim()];
  if (!mode || !level || !stage) continue;
  if (mode === "picture") continue; // ข้อรูปภาพสร้างจากไฟล์รูปด้านล่าง
  let body = m[2].replace(/\s*\*\(.*\)\*\s*$/, "").trim();
  let words;
  if (mode === "picture" || mode === "describe") words = body.split(/\s+/);
  else words = body.split(/\s*,\s*/);
  if (level === 3 && stage === 4 && mode === "question") {
    words = words.map((w) => w.replace(/ชอบหน้าไหนที่สุดคะ.*$/, "ชอบฤดูไหนที่สุดคะ หนาว ฝน หรือร้อน"));
  }
  words.forEach((w) => {
    const key = `L${level}-S${stage}-${mode}`;
    counters[key] = (counters[key] ?? 0) + 1;
    const item = { id: `${key}-${String(counters[key]).padStart(2, "0")}`, level, stage, mode, text: w };
    if (mode === "describe") {
      item.description = DESC[w] ?? "";
      if (!DESC[w]) missing.desc.push(w);
      item.accept = [w];
    } else if (mode === "sentence") {
      item.accept = [w];
    }
    items.push(item);
  });
}

// กระจายรูปทั้งหมดไปยัง 15 ด่าน (3 ระดับ × 5 ด่าน) ตามลำดับความยากง่าย
PICS.sort((a, b) => a.key.localeCompare(b.key));
PICS.forEach((p, rank) => {
  const k = Math.floor((rank * 15) / PICS.length);
  const lv = Math.floor(k / 5) + 1, st = (k % 5) + 1;
  const key = `L${lv}-S${st}-picture`;
  counters[key] = (counters[key] ?? 0) + 1;
  items.push({ id: `${key}-${String(counters[key]).padStart(2, "0")}`, level: lv, stage: st, mode: "picture", text: p.word, image: p.image, alt: p.alt, accept: [p.word] });
});

const header = `// สร้างโดย scripts/build-content.mjs จาก product/content-bank.md — อย่าแก้ด้วยมือ
import type { Item } from "./types";
export const ITEMS: Item[] = `;
fs.writeFileSync(out, header + JSON.stringify(items, null, 1) + ";\n");
const byLevel = [1, 2, 3].map((n) => items.filter((i) => i.level === n).length);
console.log("items:", items.length, "by level:", byLevel.join("/"));
console.log("pictures:", PICS.length);
if (missing.desc.length) console.log("no description:", missing.desc.join(", "));
