import { limited, tooMany } from "@/lib/ratelimit";

const MAX_BYTES = 5 * 1024 * 1024;

// เสียง → ข้อความ ด้วย ElevenLabs Scribe (ภาษาไทย)
export async function POST(req: Request) {
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) return Response.json({ error: "no_key" }, { status: 503 });
  if (limited(req, "stt", 30)) return tooMany();
  let file: FormDataEntryValue | null;
  try { file = (await req.formData()).get("audio"); } catch { return Response.json({ error: "bad_form" }, { status: 400 }); }
  if (!(file instanceof Blob) || file.size === 0) return Response.json({ error: "no_audio" }, { status: 400 });
  if (file.size > MAX_BYTES) return Response.json({ error: "too_large" }, { status: 413 });

  const ext = file.type.includes("mp4") ? "m4a" : file.type.includes("ogg") ? "ogg" : "webm";
  const send = (model: string) => {
    const body = new FormData();
    body.append("file", file, `speech.${ext}`);
    body.append("model_id", model);
    body.append("language_code", "tha");
    body.append("tag_audio_events", "false");
    return fetch("https://api.elevenlabs.io/v1/speech-to-text", {
      method: "POST",
      headers: { "xi-api-key": key },
      body,
      signal: AbortSignal.timeout(20_000),
    });
  };
  try {
    let res = await send(process.env.ELEVENLABS_STT_MODEL ?? "scribe_v2");
    let errText = "";
    if (!res.ok) {
      errText = await res.text();
      // ลองรุ่นเก่าเฉพาะเมื่อปัญหาคือโมเดล (ไม่เสียเครดิตซ้ำเมื่อไฟล์เสียงเสีย)
      if ((res.status === 400 || res.status === 422) && /model/i.test(errText)) {
        res = await send("scribe_v1");
        errText = res.ok ? "" : await res.text();
      }
    }
    if (!res.ok) {
      console.warn("[stt] elevenlabs", res.status, errText.slice(0, 200));
      return Response.json({ error: "stt_failed", status: res.status }, { status: 502 });
    }
    const data = (await res.json()) as { text?: string };
    return Response.json({ text: (data.text ?? "").trim() });
  } catch (e) {
    console.warn("[stt] error", e);
    return Response.json({ error: "stt_failed" }, { status: 502 });
  }
}
