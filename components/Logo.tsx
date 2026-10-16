// โลโก้ Phood: กล่องสีน้ำเงิน + คลื่นเสียง 5 แท่ง (ชื่อมาจาก "พูด")
export function LogoMark({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" role="img" aria-label="Phood">
      <rect width="48" height="48" rx="14" fill="#2f80ed" />
      <g stroke="#fff" strokeWidth="4" strokeLinecap="round">
        <path d="M11 21v6" /><path d="M17.5 16v16" /><path d="M24 11v26" /><path d="M30.5 16v16" /><path d="M37 21v6" />
      </g>
      <circle cx="37.5" cy="10.5" r="3.5" fill="#ff9f43" />
    </svg>
  );
}

export default function Logo({ size = 40, className = "" }: { size?: number; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <LogoMark size={size} />
      <span className="text-2xl font-bold tracking-tight text-navy">Phood</span>
    </span>
  );
}
