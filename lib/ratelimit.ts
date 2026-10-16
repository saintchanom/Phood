// จำกัดจำนวนการเรียกต่อ IP ต่อนาที (ในหน่วยความจำของ instance นั้น — กันการยิงรัวแบบง่ายๆ ไม่ใช่ทางป้องกันเต็มรูปแบบ)
const hits = new Map<string, number[]>();

export function limited(req: Request, bucket: string, max: number, windowMs = 60_000): boolean {
  const ip = (req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? "local").split(",")[0].trim();
  const key = `${bucket}:${ip}`;
  const now = Date.now();
  const arr = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  arr.push(now);
  hits.set(key, arr);
  if (hits.size > 5000) {
    hits.forEach((v, k) => { if (!v.length || now - v[v.length - 1] > windowMs) hits.delete(k); });
  }
  return arr.length > max;
}

export const tooMany = () => Response.json({ error: "rate_limited" }, { status: 429 });
