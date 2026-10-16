// ข้อความ → เสียงพูด: Gemini TTS (ถ้ามี GEMINI_API_KEY) → ElevenLabs (ถ้ามี key) → 503 ให้ client ใช้เสียงเบราว์เซอร์
const GEMINI_TTS_MODEL = process.env.GEMINI_TTS_MODEL ?? "gemini-2.5-flash-preview-tts";
// โมเดล TTS ตอบเป็นข้อความถ้าไม่มีคำสั่งนำหน้า (ได้ 400) จึงต้องสั่งให้อ่านออกเสียงเท่านั้น
const INSTRUCTION = "Read aloud in Thai, slowly and clearly, exactly this text: ";
import { limited, tooMany } from "@/lib/ratelimit";

// แคชเสียงฝั่ง server (LRU จำกัด 200 รายการ) ใช้ทั้ง Gemini และ ElevenLabs เพื่อไม่เสียโควตาซ้ำ
type Cached = { buf: Buffer; type: string };
const MAX_CACHE = 200;
const memCache = new Map<string, Cached>();
const cacheGet = (k: string) => {
  const v = memCache.get(k);
  if (v) { memCache.delete(k); memCache.set(k, v); }
  return v;
};
const cacheSet = (k: string, v: Cached) => {
  memCache.set(k, v);
  if (memCache.size > MAX_CACHE) memCache.delete(memCache.keys().next().value as string);
};
const audio = (c: Cached) => new Response(new Uint8Array(c.buf), { headers: { "content-type": c.type, "cache-control": "private, max-age=86400" } });
// ไม่ต้องกรอก Voice ID: ใช้เสียงสำเร็จรูปของ ElevenLabs เป็นค่าเริ่มต้น (เปลี่ยนได้ด้วย ELEVENLABS_VOICE_ID)
const ELEVEN_VOICE = process.env.ELEVENLABS_VOICE_ID || "JBFqnCBsd6RMkjVDRZzb";
const GEMINI_TTS_VOICE = process.env.GEMINI_TTS_VOICE ?? "Kore";

function pcmToWav(pcm: Buffer, sampleRate: number): Buffer {
  const h = Buffer.alloc(44);
  h.write("RIFF", 0); h.writeUInt32LE(36 + pcm.length, 4); h.write("WAVE", 8);
  h.write("fmt ", 12); h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(1, 22);
  h.writeUInt32LE(sampleRate, 24); h.writeUInt32LE(sampleRate * 2, 28); h.writeUInt16LE(2, 32); h.writeUInt16LE(16, 34);
  h.write("data", 36); h.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([h, pcm]);
}

async function geminiTts(text: string): Promise<Response> {
  const hit = cacheGet(`gemini:${text}`);
  if (hit) return audio(hit);
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_TTS_MODEL}:generateContent`, {
    method: "POST",
    signal: AbortSignal.timeout(15_000),
    headers: { "content-type": "application/json", "x-goog-api-key": process.env.GEMINI_API_KEY! },
    body: JSON.stringify({
      contents: [{ parts: [{ text: INSTRUCTION + text }] }],
      generationConfig: {
        responseModalities: ["AUDIO"],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: GEMINI_TTS_VOICE } } },
      },
    }),
  });
  if (!res.ok) {
    console.warn("[tts] gemini", res.status, (await res.text()).slice(0, 200));
    return Response.json({ error: "tts_failed", status: res.status }, { status: res.status === 429 ? 429 : 502 });
  }
  const data = (await res.json()) as {
    candidates?: { content?: { parts?: { inlineData?: { data?: string; mimeType?: string } }[] } }[];
  };
  const inline = data.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.data)?.inlineData;
  if (!inline?.data) return Response.json({ error: "no_audio" }, { status: 502 });
  const raw = Buffer.from(inline.data, "base64");
  // โมเดลใหม่ส่ง WAV สมบูรณ์มาแล้ว; รุ่นเก่าส่ง PCM ดิบ (audio/l16) ต้องใส่ header เอง
  const isWav = inline.mimeType?.includes("wav");
  const rate = Number(inline.mimeType?.match(/rate=(\d+)/)?.[1] ?? 24000);
  const wav = isWav ? raw : pcmToWav(raw, rate);
  const out = { buf: wav, type: "audio/wav" };
  cacheSet(`gemini:${text}`, out);
  return audio(out);
}

async function elevenTts(text: string): Promise<Response> {
  const hit = cacheGet(`eleven:${text}`);
  if (hit) return audio(hit);
  const call = (model: string) =>
    fetch(`https://api.elevenlabs.io/v1/text-to-speech/${ELEVEN_VOICE}?output_format=mp3_44100_64`, {
      method: "POST",
      signal: AbortSignal.timeout(15_000),
      headers: { "xi-api-key": process.env.ELEVENLABS_API_KEY!, "content-type": "application/json" },
      body: JSON.stringify({
        text,
        model_id: model,
        // multilingual_v2 ตรวจภาษาเอง และไม่รับ language_code
        ...(model === "eleven_multilingual_v2" ? {} : { language_code: "th" }),
      }),
    });
  let res = await call(process.env.ELEVENLABS_TTS_MODEL ?? "eleven_v3");
  if (res.status === 400 || res.status === 422) res = await call("eleven_multilingual_v2");
  if (!res.ok) {
    console.warn("[tts] elevenlabs", res.status, (await res.text()).slice(0, 200));
    return Response.json({ error: "tts_failed", status: res.status }, { status: res.status === 429 ? 429 : 502 });
  }
  const out = { buf: Buffer.from(await res.arrayBuffer()), type: "audio/mpeg" };
  cacheSet(`eleven:${text}`, out);
  return audio(out);
}

export async function POST(req: Request) {
  if (limited(req, "tts", 120)) return tooMany();
  let text: string | undefined;
  try { text = ((await req.json()) as { text?: string }).text; } catch { return Response.json({ error: "bad_json" }, { status: 400 }); }
  if (typeof text !== "string" || !text.trim() || text.length > 400) return Response.json({ error: "bad_text" }, { status: 400 });
  const hasEleven = !!process.env.ELEVENLABS_API_KEY;
  // TTS_PROVIDER=elevenlabs | gemini | browser (ค่าเริ่มต้น: elevenlabs ถ้ามี key ไม่งั้น browser)
  const provider = process.env.TTS_PROVIDER ?? (hasEleven ? "elevenlabs" : "browser");
  const hasGemini = !!process.env.GEMINI_API_KEY;
  if (provider === "elevenlabs" && hasEleven) {
    const res = await elevenTts(text);
    // โควตา/ข้อผิดพลาดของ ElevenLabs → ลอง Gemini ต่อ (ถ้ามี key) แทนที่จะเงียบ
    if (!res.ok && hasGemini) return geminiTts(text);
    return res;
  }
  if (provider === "gemini" && hasGemini) return geminiTts(text);
  return Response.json({ error: "no_key" }, { status: 503 }); // client ใช้เสียงเบราว์เซอร์แทน
}
