"use client";

import { useState } from "react";
import { SafeLink } from "./safe-link";
import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  const [failed, setFailed] = useState(false);

  return (
    <SafeLink href="/" className="inline-flex shrink-0 items-center">
      {failed ? (
        <span className={cn("text-lg font-semibold tracking-tight text-[var(--foreground)]", className)}>Modempic</span>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element -- avoid Next/Image optimizer rejections on missing asset in dev
        <img
          src="/modempic-logo.png"
          alt="Modempic"
          width={480}
          height={120}
          className={cn("h-8 w-auto object-contain object-left md:h-9", className)}
          fetchPriority="high"
          decoding="async"
          onError={() => setFailed(true)}
        />
      )}
    </SafeLink>
  );
}
