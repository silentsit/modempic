"use client";

import Link from "next/link";
import type { ComponentProps } from "react";

/**
 * `next/link` with hydration tolerance for dev tools (e.g. Cursor’s browser adds
 * `data-cursor-ref` to anchors before/after render, which would otherwise trigger a mismatch).
 */
export function SafeLink(props: ComponentProps<typeof Link>) {
  return <Link suppressHydrationWarning {...props} />;
}
