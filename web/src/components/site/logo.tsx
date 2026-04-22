import Link from "next/link";

export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className={`font-semibold tracking-tight text-[var(--foreground)] ${className ?? ""}`}>
      <span className="text-[var(--primary)]">Modempic</span>
    </Link>
  );
}
