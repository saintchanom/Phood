"use client";
import { useEffect, useRef, useState } from "react";
import { useLang } from "@/lib/i18n";
import type { User } from "@/lib/store";

type GIS = {
  accounts: { id: { initialize: (c: unknown) => void; renderButton: (el: HTMLElement, o: unknown) => void } };
};
declare global { interface Window { google?: GIS } }

function decodeJwt(token: string): Record<string, string> {
  const payload = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
  return JSON.parse(decodeURIComponent(escape(atob(payload))));
}

export default function GoogleLogin({ onUser }: { onUser: (u: User) => void }) {
  const { tx, lang } = useLang();
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const box = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!clientId) return;
    const init = () => {
      if (!window.google || !box.current) return;
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (r: { credential: string }) => {
          const p = decodeJwt(r.credential);
          onUser({ id: p.sub, name: p.name ?? p.email, email: p.email, picture: p.picture });
        },
      });
      window.google.accounts.id.renderButton(box.current, { theme: "outline", size: "large", shape: "pill", text: "signin_with", width: 320, locale: lang === "en" ? "en" : "th" });
      setReady(true);
    };
    if (window.google) return init();
    // ใช้ script เดิมถ้ามีอยู่แล้ว (กันโหลดซ้ำเมื่อ effect รันสองรอบ)
    let s = document.getElementById("gsi-client") as HTMLScriptElement | null;
    if (!s) {
      s = document.createElement("script");
      s.id = "gsi-client";
      s.src = "https://accounts.google.com/gsi/client";
      s.async = true;
      document.head.appendChild(s);
    }
    s.addEventListener("load", init);
    const onError = () => setFailed(true);
    s.addEventListener("error", onError);
    return () => { s.removeEventListener("load", init); s.removeEventListener("error", onError); };
  }, [clientId, onUser, lang]);

  return (
    <div className="space-y-3">
      {clientId ? (
        <div className="flex min-h-[48px] justify-center">
          <div ref={box} />
          {!ready && (
            <span className="text-sm text-muted">
              {failed ? tx({ th: "โหลดปุ่ม Google ไม่ได้ ตรวจอินเทอร์เน็ตแล้วรีเฟรช หรือใช้โหมดทดลองด้านล่าง", en: "Couldn't load the Google button. Check your connection and refresh, or use demo mode below." }) : tx({ th: "กำลังโหลดปุ่ม Google…", en: "Loading Google button…" })}
            </span>
          )}
        </div>
      ) : (
        <p className="text-center text-sm text-muted">{tx({ th: "(ยังไม่ได้ตั้งค่า Google login — ใช้โหมดทดลองด้านล่างได้)", en: "(Google sign-in isn't set up — use demo mode below.)" })}</p>
      )}
      <button className="btn btn-ghost" onClick={() => onUser({ id: "guest", name: tx({ th: "ผู้ทดลองใช้", en: "Demo user" }), guest: true })}>
        {tx({ th: "เริ่มโดยไม่ล็อกอิน (โหมดทดลอง)", en: "Continue without signing in (demo mode)" })}
      </button>
    </div>
  );
}
