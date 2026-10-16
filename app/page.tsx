"use client";
import Link from "next/link";
import { ArrowRightIcon, BulbIcon, CheckIcon, ChartIcon, ImageIcon, MicIcon, ShieldIcon, SpeakerIcon, StairsIcon, TextSizeIcon } from "@/components/Icons";
import LangSwitch from "@/components/LangSwitch";
import Logo from "@/components/Logo";
import { useLang } from "@/lib/i18n";

const pic = (id: string) => `/pictures/${id}.jpg`;

const STEPS = [
  { n: 1, title: { th: "ทำแบบทดสอบสั้นๆ", en: "Take a short placement test" }, body: { th: "15 ข้อ ใช้เวลาราว 5 นาที ไม่มีผิดถูกที่ตัดสินคุณ ใช้เพื่อเลือกระดับที่พอดี", en: "15 questions, about 5 minutes. Nothing is judged — it just finds the right level for you." } },
  { n: 2, title: { th: "ได้ระดับที่เหมาะกับคุณ", en: "Get a level that fits you" }, body: { th: "ระบบจัดให้ในระดับ 1–3 พร้อมเวลาโดยประมาณที่ใช้ฝึกจนจบ", en: "You're placed in level 1–3, with an estimate of how long the full programme takes." } },
  { n: 3, title: { th: "ฝึกทีละด่านที่บ้าน", en: "Practise stage by stage at home" }, body: { th: "ดูรูป ฟังโจทย์ แล้วพูด Phood ตรวจให้ทันที ผ่านเกณฑ์ก็ไปด่านต่อไป", en: "Look at the picture, listen, then speak. Phood checks instantly and moves you on when you pass." } },
];

const FEATURES = [
  { Icon: MicIcon, title: { th: "พูดแล้วตรวจให้ทันที", en: "Speak, and get checked instantly" }, body: { th: "แตะไมค์ครั้งเดียว พูดจบแล้วหยุด ระบบตัดและตรวจเอง ไม่ต้องกดซ้ำ", en: "Tap the mic once. When you stop talking, Phood ends the recording and checks it — no second tap." } },
  { Icon: BulbIcon, title: { th: "คำใบ้ 3 ขั้น", en: "3-step hints" }, body: { th: "นึกไม่ออกก็ไม่เป็นไร ขอคำใบ้ได้ตั้งแต่ความหมาย เสียงแรก ไปจนถึงฟังแล้วพูดตาม", en: "Stuck? Ask for a hint: the meaning, then the first sound, then hear it and repeat." } },
  { Icon: ImageIcon, title: { th: "รูปจริง ชัดเจน", en: "Clear, colourful pictures" }, body: { th: "ภาพสีสดใสของสิ่งของใกล้ตัว ที่เห็นแล้วนึกถึงคำได้ง่าย", en: "Bright pictures of everyday things that make the word easy to recall." } },
  { Icon: SpeakerIcon, title: { th: "มีเสียงอ่านทุกโจทย์", en: "Every prompt is read aloud" }, body: { th: "ไม่ต้องอ่านเยอะ ฟังโจทย์ซ้ำได้ไม่จำกัด", en: "Little reading needed. Replay any prompt as often as you like." } },
  { Icon: TextSizeIcon, title: { th: "ตัวอักษรปรับขนาดได้", en: "Adjustable text size" }, body: { th: "ปุ่มใหญ่ ตัวหนังสือใหญ่ อ่านสบาย ใช้ง่ายแม้ไม่คุ้นกับสมาร์ตโฟน", en: "Big buttons and large text, comfortable even if you're new to smartphones." } },
  { Icon: ChartIcon, title: { th: "เห็นความก้าวหน้า", en: "See your progress" }, body: { th: "แต่ละด่านมีคะแนนและประวัติ ให้เห็นว่าดีขึ้นทีละนิดทุกวัน", en: "Every stage has a score and history, so you can see yourself improving day by day." } },
];

const LEVELS = [
  { lv: 1, name: { th: "เริ่มต้น", en: "Beginner" }, body: { th: "คำง่ายๆ ในชีวิตประจำวัน เช่น ข้าว น้ำ แมว", en: "Simple everyday words, e.g. ข้าว (rice), น้ำ (water), แมว (cat)." }, imgs: ["pn-l1-s1-01", "pn-l1-s1-02", "pn-l1-s1-03"] },
  { lv: 2, name: { th: "ปานกลาง", en: "Intermediate" }, body: { th: "ของใช้ในบ้านและรอบตัว เช่น รองเท้า แว่นตา ทีวี", en: "Household objects, e.g. รองเท้า (shoes), แว่นตา (glasses), ทีวี (TV)." }, imgs: ["pn-l1-s3-03", "pn-l1-s3-04", "pn-l1-s4-01"] },
  { lv: 3, name: { th: "ก้าวหน้า", en: "Advanced" }, body: { th: "คำที่ละเอียดขึ้นและประโยคยาวขึ้น เช่น นาฬิกา รถเข็น ไฟฉาย", en: "More detailed words and longer sentences, e.g. นาฬิกา (clock), รถเข็น (wheelchair), ไฟฉาย (torch)." }, imgs: ["pn-l1-s5-03", "pn-l1-s5-09", "pn-l1-s5-05"] },
];

const FAQ = [
  { q: { th: "ต้องใช้อุปกรณ์อะไรบ้าง", en: "What do I need?" }, a: { th: "สมาร์ตโฟน แท็บเล็ต หรือคอมพิวเตอร์ที่มีไมโครโฟน และเปิดผ่านเบราว์เซอร์ Chrome หรือ Safari ได้เลย ไม่ต้องติดตั้งแอป", en: "A phone, tablet or computer with a microphone, using Chrome or Safari. There is nothing to install." } },
  { q: { th: "Phood แทนนักแก้ไขการพูดได้ไหม", en: "Can Phood replace a speech therapist?" }, a: { th: "ไม่ได้ Phood เป็นโค้ชช่วยฝึกซ้ำที่บ้านระหว่างวัน ไม่ใช่การวินิจฉัยหรือรักษาโรค ควรปรึกษาแพทย์หรือนักแก้ไขการพูดควบคู่กันเสมอ", en: "No. Phood is a practice coach for extra repetition at home. It does not diagnose or treat anything, so keep working with your doctor or speech therapist." } },
  { q: { th: "แอปเก็บเสียงของฉันไหม", en: "Does the app keep my voice recordings?" }, a: { th: "แอปไม่เก็บไฟล์เสียงของคุณไว้ เสียงใช้เพื่อตรวจคำตอบในแต่ละข้อเท่านั้น", en: "The app does not store your audio files. Your voice is only used to check each answer." } },
  { q: { th: "ฉันไม่ได้พูดภาษาไทย ใช้ได้ไหม", en: "I don't speak Thai — can I still try it?" }, a: { th: "ได้ เลือก EN ที่มุมบนเพื่อดูหน้าจอเป็นภาษาอังกฤษ แต่เสียง คำตอบ และคำพูดของโค้ชยังเป็นภาษาไทย เพราะ Phood สร้างมาเพื่อฝึกพูดภาษาไทย", en: "Yes — switch to EN at the top to see the interface in English. The spoken prompts, answers and coach replies stay in Thai, because Phood is built for practising Thai. English meanings and romanisation are shown to help." } },
  { q: { th: "ถ้าตอบไม่ได้ต้องทำอย่างไร", en: "What if I can't answer?" }, a: { th: "ขอคำใบ้ได้ถึง 3 ขั้น หรือข้ามข้อนั้นได้เลย ข้อที่ข้ามไม่ถูกนับเป็นคะแนน และถ้าไม่ผ่านด่านก็ลองใหม่ได้ไม่จำกัด", en: "Ask for up to 3 hints, or skip the question. Skipped questions don't count against you, and you can retry a stage as many times as you like." } },
];

function PhoneMock() {
  const { tx } = useLang();
  return (
    <div className="relative mx-auto w-[290px] lg:w-[320px]" aria-hidden>
      <div className="absolute -inset-6 rounded-[56px] bg-gradient-to-br from-soft to-white" />
      <div className="relative rounded-[44px] border-[10px] border-navy bg-white p-4 shadow-[0_30px_60px_rgba(30,58,95,0.25)]">
        <div className="mx-auto mb-3 h-1.5 w-16 rounded-full bg-line" />
        <div className="flex gap-1">
          {[0, 1, 2, 3, 4, 5].map((i) => <span key={i} className={`h-2 flex-1 rounded-full ${i < 2 ? "bg-brand" : i === 2 ? "bg-brand/60" : "bg-soft"}`} />)}
        </div>
        <div className="mt-3 rounded-3xl border-2 border-line p-3 text-center">
          <span className="rounded-full bg-soft px-3 py-1 text-sm font-semibold text-link">{tx({ th: "บอกชื่อสิ่งนี้", en: "Name this" })}</span>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={pic("pn-l1-s1-02")} alt="" className="mx-auto mt-2 h-44 w-44 object-contain" />
        </div>
        <div className="mt-3 flex items-center justify-center gap-2 rounded-2xl bg-brand py-4 text-lg font-bold text-white shadow-[0_4px_0_var(--blue-dark)]">
          <MicIcon /> {tx({ th: "แตะแล้วพูด", en: "Tap and speak" })}
        </div>
      </div>
      <div className="absolute -left-6 top-24 hidden rotate-[-6deg] items-center gap-2 rounded-2xl bg-white px-4 py-3 text-lg font-bold text-ok-text shadow-[0_12px_30px_rgba(30,58,95,0.15)] sm:flex" style={{ color: "var(--ok-text)" }}>
        <span className="flex h-8 w-8 items-center justify-center rounded-full" style={{ background: "var(--ok-soft)" }}><CheckIcon width="1.1em" height="1.1em" /></span> {tx({ th: "เก่งมาก!", en: "Well done!" })}
      </div>
      <div className="absolute -right-8 bottom-28 hidden rotate-[5deg] items-center gap-2 rounded-2xl bg-white px-4 py-3 text-lg font-bold text-link shadow-[0_12px_30px_rgba(30,58,95,0.15)] sm:flex">
        <StairsIcon /> {tx({ th: "ด่าน 3 / 5", en: "Stage 3 / 5" })}
      </div>
    </div>
  );
}

export default function Landing() {
  const { tx } = useLang();
  return (
    <div className="overflow-x-clip bg-white">
      <header className="sticky top-0 z-30 border-b-2 border-line bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 lg:px-8">
          <Link href="/" aria-label={tx({ th: "Phood หน้าแรก", en: "Phood home" })}><Logo size={38} /></Link>
          <nav aria-label={tx({ th: "เมนูหน้าแรก", en: "Site menu" })} className="hidden items-center gap-7 text-lg font-semibold text-sub md:flex">
            <a href="#how" className="hover:text-link">{tx({ th: "วิธีใช้งาน", en: "How it works" })}</a>
            <a href="#features" className="hover:text-link">{tx({ th: "จุดเด่น", en: "Features" })}</a>
            <a href="#levels" className="hover:text-link">{tx({ th: "ระดับการฝึก", en: "Levels" })}</a>
            <a href="#faq" className="hover:text-link">{tx({ th: "คำถามที่พบบ่อย", en: "FAQ" })}</a>
          </nav>
          <div className="flex items-center gap-3">
            <LangSwitch />
            <Link href="/login" className="btn btn-primary !w-auto !min-h-12 !rounded-2xl px-5 !text-lg">{tx({ th: "เริ่มใช้งาน", en: "Get started" })}</Link>
          </div>
        </div>
      </header>

      <section className="relative">
        <div className="pointer-events-none absolute -right-32 -top-32 h-[28rem] w-[28rem] rounded-full bg-soft blur-3xl" aria-hidden />
        <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-4 py-14 lg:grid-cols-2 lg:px-8 lg:py-24">
          <div className="rise text-center lg:text-left">
            <span className="inline-flex items-center gap-2 rounded-full bg-soft px-4 py-1.5 text-base font-semibold text-link"><ShieldIcon width="1.1em" height="1.1em" /> {tx({ th: "ฝึกพูดหลังโรคหลอดเลือดสมอง", en: "Speech practice after stroke" })}</span>
            <h1 className="mt-5 text-4xl font-bold leading-tight text-navy sm:text-5xl lg:text-6xl">{tx({ th: "ฝึกพูดที่บ้าน", en: "Practise speaking Thai at home" })}<br /><span className="text-brand">{tx({ th: "ทีละคำ ทีละด่าน", en: "one word, one stage at a time" })}</span></h1>
            <p className="mx-auto mt-5 max-w-xl text-xl leading-relaxed text-sub lg:mx-0 lg:text-2xl">{tx({ th: "Phood คือโค้ชฝึกพูดที่อยู่ในมือถือคุณ ดูรูป ฟังโจทย์ แล้วพูด ระบบตรวจให้ทันทีและให้กำลังใจทุกก้าว ไม่ต้องนัดหมาย ไม่ต้องรอใคร", en: "Phood is a speaking coach in your pocket. Look at a picture, listen, then say the Thai word. It checks you instantly and cheers you on — no appointments, no waiting." })}</p>
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start">
              <Link href="/login" className="btn btn-primary sm:!w-auto sm:px-9" style={{ minHeight: 68, fontSize: "1.4rem" }}>{tx({ th: "เริ่มฝึกเลย", en: "Start practising" })} <ArrowRightIcon /></Link>
              <a href="#how" className="btn btn-line sm:!w-auto sm:px-9" style={{ minHeight: 68 }}>{tx({ th: "ดูวิธีใช้งาน", en: "See how it works" })}</a>
            </div>
            <ul className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-2 text-lg text-sub lg:justify-start">
              {[tx({ th: "ไม่ต้องติดตั้งแอป", en: "Nothing to install" }), tx({ th: "ปุ่มและตัวอักษรใหญ่", en: "Large buttons and text" }), tx({ th: "ข้ามหรือขอคำใบ้ได้เสมอ", en: "Skip or ask for hints anytime" })].map((t) => (
                <li key={t} className="flex items-center gap-2"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-soft text-link"><CheckIcon width="1em" height="1em" /></span>{t}</li>
              ))}
            </ul>
          </div>
          <div className="rise" style={{ animationDelay: ".12s" }}><PhoneMock /></div>
        </div>
      </section>

      <section id="how" className="scroll-mt-20 bg-[#f7faff] py-16 lg:py-24">
        <div className="mx-auto max-w-6xl px-4 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold lg:text-4xl">{tx({ th: "เริ่มง่ายใน 3 ขั้นตอน", en: "Start in 3 easy steps" })}</h2>
            <p className="mt-3 text-xl text-sub">{tx({ th: "ไม่ต้องตั้งค่าอะไรยุ่งยาก", en: "No complicated setup." })}</p>
          </div>
          <ol className="mt-12 grid gap-6 md:grid-cols-3">
            {STEPS.map((s) => (
              <li key={s.n} className="card p-6">
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand text-2xl font-bold text-white shadow-[0_4px_0_var(--blue-dark)]">{s.n}</span>
                <h3 className="mt-5 text-2xl font-bold">{tx(s.title)}</h3>
                <p className="mt-2 text-lg leading-relaxed text-sub">{tx(s.body)}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="features" className="scroll-mt-20 py-16 lg:py-24">
        <div className="mx-auto max-w-6xl px-4 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold lg:text-4xl">{tx({ th: "ออกแบบมาให้ใช้ง่ายที่สุด", en: "Designed to be as easy as possible" })}</h2>
            <p className="mt-3 text-xl text-sub">{tx({ th: "ทุกรายละเอียดคิดเผื่อผู้ที่กำลังฟื้นฟูการพูดและผู้สูงอายุ", en: "Every detail is made for people recovering their speech, and for older adults." })}</p>
          </div>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ Icon, title, body }) => (
              <div key={title.en} className="card p-6 transition-transform hover:-translate-y-1">
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-soft text-link"><Icon width="1.7em" height="1.7em" /></span>
                <h3 className="mt-4 text-xl font-bold">{tx(title)}</h3>
                <p className="mt-1.5 text-lg leading-relaxed text-sub">{tx(body)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="levels" className="scroll-mt-20 bg-[#f7faff] py-16 lg:py-24">
        <div className="mx-auto max-w-6xl px-4 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold lg:text-4xl">{tx({ th: "3 ระดับ ค่อยๆ ก้าวขึ้นไป", en: "3 levels, one step at a time" })}</h2>
            <p className="mt-3 text-xl text-sub">{tx({ th: "แต่ละระดับมี 5 ด่าน ผ่านด่านเมื่อตอบถูกอย่างน้อย 80% ของข้อที่ทำ", en: "Each level has 5 stages. Pass a stage by answering at least 80% of the questions you attempt." })}</p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {LEVELS.map((l) => (
              <div key={l.lv} className="card overflow-hidden">
                <div className="flex justify-center gap-2 bg-soft px-4 py-5">
                  {l.imgs.map((i) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={i} src={pic(i)} alt="" className="h-24 w-24 rounded-2xl bg-white object-contain p-1" />
                  ))}
                </div>
                <div className="p-6">
                  <p className="text-base font-semibold text-link">{tx({ th: "ระดับ", en: "Level" })} {l.lv}</p>
                  <h3 className="text-2xl font-bold">{tx(l.name)}</h3>
                  <p className="mt-2 text-lg leading-relaxed text-sub">{tx(l.body)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 lg:py-20">
        <div className="mx-auto flex max-w-4xl flex-col items-center gap-4 px-4 text-center sm:flex-row sm:text-left lg:px-8">
          <span className="flex h-16 w-16 flex-none items-center justify-center rounded-2xl text-3xl" style={{ background: "var(--orange-soft)", color: "var(--orange-text)" }}><ShieldIcon width="1.2em" height="1.2em" /></span>
          <p className="text-xl leading-relaxed text-sub"><strong className="text-navy">{tx({ th: "Phood ช่วยฝึกภาษา ไม่ใช่การวินิจฉัยหรือรักษาโรค", en: "Phood supports language practice. It is not a diagnosis or treatment." })}</strong> {tx({ th: "หากตอบได้น้อยในแบบทดสอบ แอปจะแนะนำให้ปรึกษาแพทย์หรือนักแก้ไขการพูด เพื่อให้ได้คำแนะนำที่เหมาะกับคุณ", en: "If you answer few questions in the placement test, the app suggests talking to a doctor or speech therapist for advice that suits you." })}</p>
        </div>
      </section>

      <section id="faq" className="scroll-mt-20 bg-[#f7faff] py-16 lg:py-24">
        <div className="mx-auto max-w-3xl px-4 lg:px-8">
          <h2 className="text-center text-3xl font-bold lg:text-4xl">{tx({ th: "คำถามที่พบบ่อย", en: "Frequently asked questions" })}</h2>
          <div className="mt-10 space-y-3">
            {FAQ.map((f) => (
              <details key={f.q.en} className="card group p-5">
                <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-4 text-xl font-bold">
                  {tx(f.q)}
                  <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-soft text-2xl text-link transition-transform group-open:rotate-45" aria-hidden>+</span>
                </summary>
                <p className="mt-3 text-lg leading-relaxed text-sub">{tx(f.a)}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-16 lg:py-24">
        <div className="mx-auto max-w-5xl rounded-[36px] bg-brand px-6 py-14 text-center text-white shadow-[0_24px_50px_rgba(47,128,237,0.35)] lg:py-20">
          <h2 className="text-3xl font-bold lg:text-5xl">{tx({ th: "พร้อมเริ่มฝึกวันนี้ไหม", en: "Ready to start today?" })}</h2>
          <p className="mx-auto mt-4 max-w-xl text-xl opacity-95">{tx({ th: "เริ่มจากแบบทดสอบสั้นๆ ไม่กี่นาที แล้วค่อยๆ ฝึกไปทีละด่าน", en: "Begin with a short test that takes a few minutes, then practise one stage at a time." })}</p>
          <Link href="/login" className="btn mx-auto mt-8 bg-white !text-link sm:!w-auto sm:px-12" style={{ minHeight: 72, fontSize: "1.4rem", boxShadow: "0 4px 0 rgba(0,0,0,.18)" }}>{tx({ th: "เริ่มใช้งาน Phood", en: "Start using Phood" })} <ArrowRightIcon /></Link>
        </div>
      </section>

      <footer className="border-t-2 border-line py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 text-center sm:flex-row sm:text-left lg:px-8">
          <Logo size={34} />
          <p className="text-base text-sub">© 2026 Phood · {tx({ th: "ช่วยฝึกภาษา ไม่ใช่การวินิจฉัยหรือรักษาโรค", en: "Language practice support, not diagnosis or treatment." })}</p>
        </div>
      </footer>
    </div>
  );
}
