import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Lightweight entrance for below-the-fold homepage blocks.
 * CSS-only so the homepage does not pay for framer-motion on first paint.
 */
export function Reveal({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  return <div className={cn("reveal-in", className)}>{children}</div>;
}
