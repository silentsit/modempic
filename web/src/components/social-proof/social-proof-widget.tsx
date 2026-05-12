"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { usePathname } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { pathnameShowsSocialProof } from "@/lib/social-proof/path-matching";
import type { SocialProofActivityItemDto } from "@/lib/social-proof/queries";
import type { SocialProofBootstrap } from "@/lib/social-proof/types";

type ApiShape = {
  items: SocialProofActivityItemDto[];
  aggregateCount?: number;
  aggregateHours?: number;
};

function jitterMs(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1));
}

export function SocialProofWidget({ bootstrap }: { bootstrap: SocialProofBootstrap }) {
  const pathname = usePathname() ?? "/";
  const reduceMotion = useReducedMotion();
  const pathEnv = process.env.NEXT_PUBLIC_SOCIAL_PROOF_PATHS;
  const showHere = pathnameShowsSocialProof(pathname, pathEnv);

  const [mounted, setMounted] = useState(false);
  const [items, setItems] = useState(bootstrap.items);
  const [aggregateCount, setAggregateCount] = useState(bootstrap.aggregateCount);
  const [aggregateHours, setAggregateHours] = useState(bootstrap.aggregateHours);
  const [index, setIndex] = useState(0);
  const [, bumpRelative] = useState(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!items.length) return;
    const t = window.setInterval(() => {
      setIndex((i) => (i + 1) % items.length);
    }, 9200);
    return () => window.clearInterval(t);
  }, [items.length]);

  useEffect(() => {
    setIndex((i) => {
      if (items.length === 0) return 0;
      return Math.min(i, items.length - 1);
    });
  }, [items]);

  useEffect(() => {
    const t = window.setInterval(() => bumpRelative((x) => x + 1), 30_000);
    return () => window.clearInterval(t);
  }, []);

  useEffect(() => {
    if (!mounted || !showHere) return;

    const poll = async () => {
      try {
        const qs = new URLSearchParams({ windowDays: String(bootstrap.windowDays), take: "15" });
        if (bootstrap.showAggregate) qs.set("aggregateHours", String(bootstrap.aggregateHours ?? 24));
        const res = await fetch(`/api/social-proof/activity?${qs}`, { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as ApiShape;
        if (Array.isArray(data.items) && data.items.length > 0) {
          setItems(data.items);
          setAggregateCount(data.aggregateCount);
          setAggregateHours(data.aggregateHours);
          setIndex(0);
        }
      } catch {
        /* ignore transient network errors */
      }
    };

    poll();
    const iv = window.setInterval(poll, jitterMs(65_000, 115_000));
    return () => window.clearInterval(iv);
  }, [mounted, showHere, bootstrap.windowDays, bootstrap.showAggregate, bootstrap.aggregateHours]);

  const current = items[index];
  let relativeLabel = "";
  if (current) {
    try {
      relativeLabel = formatDistanceToNow(new Date(current.completedAtIso), { addSuffix: true });
    } catch {
      relativeLabel = "";
    }
  }

  if (!mounted || !showHere || !current) return null;

  const showFomo =
    bootstrap.showAggregate &&
    typeof aggregateCount === "number" &&
    aggregateCount > 0 &&
    (aggregateHours ?? bootstrap.aggregateHours ?? 0) > 0;

  const body = (
    <>
      <p className="text-sm leading-snug text-[var(--foreground)]">{current.message}</p>
      {relativeLabel ? (
        <p className="mt-1 text-xs text-[var(--muted-foreground)]">{relativeLabel}</p>
      ) : null}
      {showFomo ? (
        <p className="mt-2 text-xs font-medium text-[var(--foreground)]">
          {aggregateCount} orders in the last {aggregateHours ?? bootstrap.aggregateHours} hours
        </p>
      ) : null}
    </>
  );

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed bottom-4 left-4 z-[70] max-w-[min(92vw,20rem)] rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 shadow-lg"
    >
      {reduceMotion ? (
        <div key={`${current.completedAtIso}:${current.message}`}>{body}</div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={`${current.completedAtIso}:${current.message}`}
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.99 }}
            transition={{ duration: 0.35 }}
          >
            {body}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
