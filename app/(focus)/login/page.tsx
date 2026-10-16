"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import GoogleLogin from "@/components/GoogleLogin";
import { ArrowLeftIcon } from "@/components/Icons";
import Logo from "@/components/Logo";
import LangSwitch from "@/components/LangSwitch";
import { useLang } from "@/lib/i18n";
import { store, type User } from "@/lib/store";

export default function Login() {
  const router = useRouter();
  const { tx } = useLang();
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (store.getUser()) router.replace("/home");
    else setReady(true);
  }, [router]);
  const onUser = useCallback((u: User) => { store.setUser(u); router.replace("/home"); }, [router]);
  if (!ready) return null;

  return (
    <div className="flex flex-1 flex-col justify-center gap-8">
      <div className="flex justify-end"><LangSwitch /></div>
      <div className="rise space-y-3 text-center">
        <Logo size={56} className="justify-center" />
        <h1 className="text-3xl font-bold">{tx({ th: "ยินดีต้อนรับสู่ Phood", en: "Welcome to Phood" })}</h1>
        <p className="text-xl text-sub">{tx({ th: "โค้ชฝึกพูดที่บ้าน ฝึกด้วยตัวเอง ทีละด่าน", en: "Your at-home coach for practising spoken Thai, one stage at a time." })}</p>
      </div>
      <div className="card rise space-y-4 p-6" style={{ animationDelay: ".08s" }}>
        <p className="text-center text-xl font-semibold">{tx({ th: "เริ่มต้นใช้งาน", en: "Get started" })}</p>
        <GoogleLogin onUser={onUser} />
      </div>
      <Link href="/" className="mx-auto flex min-h-12 items-center gap-2 text-base font-semibold text-sub"><ArrowLeftIcon /> {tx({ th: "กลับหน้าแรก", en: "Back to home" })}</Link>
    </div>
  );
}
