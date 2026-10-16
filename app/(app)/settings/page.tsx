"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LogoutIcon } from "@/components/Icons";
import TextSize from "@/components/TextSize";
import LangSwitch from "@/components/LangSwitch";
import { useLang } from "@/lib/i18n";
import { store, type User } from "@/lib/store";

export default function Settings() {
  const router = useRouter();
  const { tx } = useLang();
  const [user, setUser] = useState<User | null>(null);
  const [confirmRetake, setConfirmRetake] = useState(false);
  useEffect(() => { setUser(store.getUser()); }, []);
  if (!user) return null;

  return (
    <div className="space-y-6">
      <header className="rise">
        <h1 className="text-3xl font-bold lg:text-4xl">{tx({ th: "ตั้งค่า", en: "Settings" })}</h1>
      </header>

      <section className="card rise space-y-3 p-5 lg:p-6">
        <h2 className="text-xl font-bold">{tx({ th: "ภาษาหน้าจอ", en: "Display language" })}</h2>
        <p className="text-base text-sub">{tx({ th: "เปลี่ยนภาษาของเมนูและข้อความ เสียงและคำตอบของแบบฝึกยังเป็นภาษาไทยเสมอ", en: "Changes the menus and messages. Spoken prompts and answers in the exercises always stay Thai." })}</p>
        <LangSwitch />
      </section>

      <section className="card rise space-y-3 p-5 lg:p-6" style={{ animationDelay: ".05s" }}>
        <h2 className="text-xl font-bold">{tx({ th: "ขนาดตัวอักษร", en: "Text size" })}</h2>
        <p className="text-base text-sub">{tx({ th: "เลือกขนาดที่อ่านสบายที่สุด ใช้กับทั้งแอป", en: "Choose the size that is most comfortable to read. Applies to the whole app." })}</p>
        <TextSize />
      </section>

      <section className="card rise space-y-3 p-5 lg:p-6" style={{ animationDelay: ".1s" }}>
        <h2 className="text-xl font-bold">{tx({ th: "แบบทดสอบจัดระดับ", en: "Placement test" })}</h2>
        <p className="text-base text-sub">{tx({ th: "ทำใหม่เพื่อจัดระดับอีกครั้ง ระดับและด่านปัจจุบันจะถูกแทนที่", en: "Retake it to be placed again. Your current level and stage will be replaced." })}</p>
        {!confirmRetake ? (
          <button className="btn btn-line lg:!w-auto lg:px-8" onClick={() => setConfirmRetake(true)}>{tx({ th: "ทำแบบทดสอบใหม่", en: "Retake the test" })}</button>
        ) : (
          <div className="alert alert-info flex-col !items-stretch" role="alertdialog">
            <p>{tx({ th: "ระดับและด่านปัจจุบันจะถูกแทนที่ ทำต่อไหม", en: "Your current level and stage will be replaced. Continue?" })}</p>
            <div className="grid grid-cols-2 gap-3 lg:max-w-sm">
              <button className="btn btn-primary" onClick={() => router.push(store.hasConsent() ? "/placement" : "/consent")}>{tx({ th: "ทำใหม่", en: "Retake" })}</button>
              <button className="btn btn-line" onClick={() => setConfirmRetake(false)}>{tx({ th: "ยกเลิก", en: "Cancel" })}</button>
            </div>
          </div>
        )}
      </section>

      <section className="card rise space-y-3 p-5 lg:p-6" style={{ animationDelay: ".15s" }}>
        <h2 className="text-xl font-bold">{tx({ th: "บัญชี", en: "Account" })}</h2>
        <p className="text-base text-sub">{user.guest ? tx({ th: "โหมดทดลอง (ไม่ได้ล็อกอิน)", en: "Demo mode (not signed in)" }) : user.email}</p>
        <button className="btn btn-line lg:!w-auto lg:px-8" onClick={() => { store.setUser(null); router.push("/"); }}>
          <LogoutIcon /> {tx({ th: "ออกจากระบบ", en: "Log out" })}
        </button>
        <p className="text-sm text-muted">{tx({ th: "ความก้าวหน้าของคุณยังอยู่ในเครื่องนี้ เมื่อกลับมาล็อกอินอีกครั้ง", en: "Your progress stays on this device and is back when you log in again." })}</p>
      </section>

      <p className="text-center text-sm text-muted">{tx({ th: "Phood ช่วยฝึกภาษา ไม่ใช่การวินิจฉัยหรือรักษาโรค", en: "Phood supports language practice. It is not a diagnosis or treatment." })}</p>
    </div>
  );
}
