"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import type { SocialProofBootstrap } from "@/lib/social-proof/types";

const SocialProofWidget = dynamic(
  () => import("@/components/social-proof/social-proof-widget").then((m) => ({ default: m.SocialProofWidget })),
  { ssr: false },
);

function runWhenIdle(fn: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const ric = window.requestIdleCallback?.bind(window);
  if (ric) {
    const id = ric(fn, { timeout: 3500 });
    return () => window.cancelIdleCallback?.(id);
  }
  const id = window.setTimeout(fn, 2200);
  return () => window.clearTimeout(id);
}

export function SocialProofLoader() {
  const [bootstrap, setBootstrap] = useState<SocialProofBootstrap | null>(null);

  useEffect(() => {
    let cancelled = false;
    const stop = runWhenIdle(() => {
      fetch("/api/social-proof/bootstrap", { cache: "no-store" })
        .then((res) => (res.ok ? res.json() : null))
        .then((data: SocialProofBootstrap | null) => {
          if (!cancelled) setBootstrap(data);
        })
        .catch(() => {
          if (!cancelled) setBootstrap(null);
        });
    });
    return () => {
      cancelled = true;
      stop();
    };
  }, []);

  return bootstrap ? <SocialProofWidget bootstrap={bootstrap} /> : null;
}
