"use client";

import { SafeLink } from "./safe-link";

export function Logo({ className }: { className?: string }) {
  return (
    <SafeLink href="/" className={`font-semibold tracking-tight text-[var(--foreground)] ${className ?? ""}`}>
      <span className="text-[var(--primary)]">Modempic</span>
    </SafeLink>
  );
}
