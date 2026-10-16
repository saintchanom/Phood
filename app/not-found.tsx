"use client";
import Link from "next/link";
import Logo from "@/components/Logo";
import { useLang } from "@/lib/i18n";

// หน้า 404 ในธีม Phood (แทนหน้า "404 This page could not be found." ของ Next)
export default function NotFound() {
  const { tx } = useLang();
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-6 px-4 text-center">
      <Logo size={48} />
      <p className="text-7xl font-bold text-brand">404</p>
      <h1 className="text-3xl font-bold">{tx({ th: "ไม่พบหน้านี้", en: "Page not found" })}</h1>
      <p className="text-xl text-sub">{tx({ th: "หน้าที่คุณต้องการอาจถูกย้ายหรือพิมพ์ที่อยู่ไม่ถูกต้อง กลับไปหน้าหลักแล้วลองใหม่ได้เลย", en: "The page may have moved, or the address may be mistyped. Go back home and try again." })}</p>
      <Link href="/home" className="btn btn-primary" style={{ minHeight: 72 }}>{tx({ th: "กลับหน้าหลัก", en: "Back to home" })}</Link>
    </main>
  );
}
