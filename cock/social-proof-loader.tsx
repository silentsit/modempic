"use client";

import { useEffect, useState } from "react";
import { SocialProofWidget } from "@/components/social-proof/social-proof-widget";
import type { SocialProofBootstrap } from "@/lib/social-proof/types";

export function SocialProofLoader() {
  const [bootstrap, setBootstrap] = useState<SocialProofBootstrap | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/social-proof/bootstrap", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: SocialProofBootstrap | null) => {
        if (!cancelled) setBootstrap(data);
      })
      .catch(() => {
        if (!cancelled) setBootstrap(null);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return bootstrap ? <SocialProofWidget bootstrap={bootstrap} /> : null;
}
