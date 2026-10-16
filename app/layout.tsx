import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans_Thai } from "next/font/google";
import "./globals.css";
import Script from "next/script";
import AudioUnlock from "@/components/AudioUnlock";
import { LangProvider } from "@/lib/i18n";

const plex = IBM_Plex_Sans_Thai({ variable: "--font-plex", subsets: ["thai", "latin"], weight: ["400", "500", "600", "700"] });

export const metadata: Metadata = {
  title: { default: "Phood — โค้ชฝึกพูดที่บ้าน", template: "%s · Phood" },
  description: "Phood โค้ชฝึกพูดที่บ้านสำหรับผู้ฝึกพูดหลังโรคหลอดเลือดสมอง ฝึกด้วยภาพและเสียง ทีละด่าน ตรวจคำตอบให้ทันที",
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#2F80ED" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="th" className={`${plex.variable} h-full`} suppressHydrationWarning>
      <body className="min-h-full">
        {/* ใช้ขนาดตัวอักษรที่ผู้ใช้เลือกไว้ตั้งแต่ก่อนโต้ตอบ (กันตัวอักษรกระโดด) */}
        <Script id="text-size-init" strategy="beforeInteractive">{`try{var s=localStorage.getItem("aphasia.textsize");if(s)document.documentElement.dataset.size=s}catch(e){}`}</Script>
        <AudioUnlock />
        <LangProvider>{children}</LangProvider>
      </body>
    </html>
  );
}
