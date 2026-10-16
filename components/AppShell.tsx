"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ChartIcon, HomeIcon, LogoutIcon, PlayIcon, SettingsIcon } from "./Icons";
import LangSwitch from "./LangSwitch";
import Logo from "./Logo";
import { useLang } from "@/lib/i18n";
import { store, type User } from "@/lib/store";

const NAV = [
  { href: "/home", label: { th: "หน้าหลัก", en: "Home" }, Icon: HomeIcon },
  { href: "/practice", label: { th: "ฝึกพูด", en: "Practise" }, Icon: PlayIcon },
  { href: "/progress", label: { th: "ความก้าวหน้า", en: "Progress" }, Icon: ChartIcon },
  { href: "/settings", label: { th: "ตั้งค่า", en: "Settings" }, Icon: SettingsIcon },
] as const;

function Avatar({ user, size = 44 }: { user: User; size?: number }) {
  return user.picture ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={user.picture} alt="" width={size} height={size} className="rounded-full" referrerPolicy="no-referrer" style={{ width: size, height: size }} />
  ) : (
    <span className="flex items-center justify-center rounded-full bg-soft font-bold text-link" style={{ width: size, height: size }}>
      {(user.name || "?").trim().charAt(0).toUpperCase()}
    </span>
  );
}

// กรอบแอปหลังเข้าสู่ระบบ: เดสก์ท็อป = ไซด์บาร์ซ้าย · มือถือ = แถบบน + เมนูล่าง (อยู่ในระยะหัวแม่มือ)
export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { tx } = useLang();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const u = store.getUser();
    if (!u) router.replace("/login");
    else setUser(u);
  }, [router]);

  if (!user) return null;
  const logout = () => { store.setUser(null); router.push("/"); };
  const active = (href: string) => pathname === href || pathname.startsWith(href + "/");

  return (
    <div className="min-h-dvh bg-[#f7faff]">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-72 flex-col border-r-2 border-line bg-white p-5 lg:flex">
        <Link href="/home" className="px-2 py-2"><Logo /></Link>
        <nav aria-label={tx({ th: "เมนูหลัก", en: "Main menu" })} className="mt-8 flex flex-1 flex-col gap-2">
          {NAV.map(({ href, label, Icon }) => (
            <Link
              key={href}
              href={href}
              aria-current={active(href) ? "page" : undefined}
              className={`flex min-h-14 items-center gap-3 rounded-2xl px-4 text-lg font-semibold transition-colors ${active(href) ? "bg-brand text-white shadow-[0_3px_0_var(--blue-dark)]" : "text-sub hover:bg-soft hover:text-link"}`}
            >
              <Icon width="1.4em" height="1.4em" /> {tx(label)}
            </Link>
          ))}
        </nav>
        <div className="mb-3 flex justify-center"><LangSwitch /></div>
        <div className="space-y-3 rounded-2xl bg-soft p-4">
          <div className="flex items-center gap-3">
            <Avatar user={user} />
            <div className="min-w-0">
              <p className="truncate text-lg font-bold leading-tight">{user.name}</p>
              <p className="truncate text-sm text-sub">{user.guest ? tx({ th: "โหมดทดลอง", en: "Demo mode" }) : user.email}</p>
            </div>
          </div>
          <button onClick={logout} className="flex min-h-11 w-full items-center gap-2 rounded-xl px-2 text-base font-semibold text-sub hover:text-link">
            <LogoutIcon /> {tx({ th: "ออกจากระบบ", en: "Log out" })}
          </button>
        </div>
      </aside>

      <header className="sticky top-0 z-20 flex items-center justify-between border-b-2 border-line bg-white/95 px-4 py-2.5 backdrop-blur lg:hidden">
        <Link href="/home"><Logo size={36} /></Link>
        <div className="flex items-center gap-2"><LangSwitch /><Link href="/settings" aria-label={tx({ th: "ตั้งค่า", en: "Settings" })}><Avatar user={user} size={40} /></Link></div>
      </header>

      <div className="lg:pl-72">
        <main className="mx-auto w-full max-w-5xl px-4 pb-28 pt-6 lg:px-10 lg:pb-12 lg:pt-10">{children}</main>
      </div>

      <nav aria-label={tx({ th: "เมนูหลัก", en: "Main menu" })} className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-4 border-t-2 border-line bg-white pb-[env(safe-area-inset-bottom)] lg:hidden">
        {NAV.map(({ href, label, Icon }) => (
          <Link
            key={href}
            href={href}
            aria-current={active(href) ? "page" : undefined}
            className={`flex min-h-16 flex-col items-center justify-center gap-0.5 text-sm font-semibold ${active(href) ? "text-link" : "text-muted"}`}
          >
            <span className={`flex h-8 w-14 items-center justify-center rounded-full ${active(href) ? "bg-soft" : ""}`}><Icon width="1.5em" height="1.5em" /></span>
            {tx(label)}
          </Link>
        ))}
      </nav>
    </div>
  );
}
