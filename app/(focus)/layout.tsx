// โหมดโฟกัส (แบบทดสอบ/ฝึก/ผลลัพธ์): ไม่มีเมนู ให้ผู้ใช้จดจ่อกับโจทย์ — เดสก์ท็อปจัดกลางและกว้างขึ้น
export default function FocusLayout({ children }: { children: React.ReactNode }) {
  return <main className="mx-auto flex min-h-dvh w-full max-w-xl flex-col px-4 py-5 lg:max-w-3xl lg:py-8">{children}</main>;
}
