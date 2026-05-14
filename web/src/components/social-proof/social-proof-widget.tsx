"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { usePathname } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { ShieldCheck, X } from "lucide-react";
import { pathnameShowsSocialProof } from "@/lib/social-proof/path-matching";
import type { SocialProofActivityItemDto } from "@/lib/social-proof/queries";
import type { SocialProofBootstrap } from "@/lib/social-proof/types";

type ApiShape = {
  items: SocialProofActivityItemDto[];
  aggregateCount?: number;
  aggregateHours?: number;
};

const DISMISS_SESSION_KEY = "modempic_social_proof_snooze_until";

function jitterMs(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1));
}

function readSnoozeUntil(): number {
  try {
    const raw = sessionStorage.getItem(DISMISS_SESSION_KEY);
    if (!raw) return 0;
    const n = Number(raw);
    return Number.isFinite(n) ? n : 0;
  } catch {
    return 0;
  }
}

function snoozeForHours(hours: number) {
  try {
    sessionStorage.setItem(DISMISS_SESSION_KEY, String(Date.now() + hours * 60 * 60 * 1000));
  } catch {
    /* private mode */
  }
}

function avatarLetter(name: string): string {
  const t = name.trim();
  if (!t) return "?";
  const ch = t.charAt(0).toUpperCase();
  return /[A-Z0-9]/i.test(ch) ? ch : "?";
}

export function SocialProofWidget({ bootstrap }: { bootstrap: SocialProofBootstrap }) {
  const pathname = usePathname() ?? "/";
  const reduceMotion = useReducedMotion();
  const pathEnv = process.env.NEXT_PUBLIC_SOCIAL_PROOF_PATHS;
  const showHere = pathnameShowsSocialProof(pathname, pathEnv);
  const brandLabel = (process.env.NEXT_PUBLIC_SOCIAL_PROOF_BRAND_LABEL ?? "Modempic").trim() || "Modempic";

  const [mounted, setMounted] = useState(false);
  const [tabVisible, setTabVisible] = useState(true);
  const [snoozed, setSnoozed] = useState(false);
  const [items, setItems] = useState(bootstrap.items);
  const [aggregateCount, setAggregateCount] = useState(bootstrap.aggregateCount);
  const [aggregateHours, setAggregateHours] = useState(bootstrap.aggregateHours);
  const [index, setIndex] = useState(0);
  const [, bumpRelative] = useState(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setSnoozed(Date.now() < readSnoozeUntil());
  }, []);

  useEffect(() => {
    const onVis = () => setTabVisible(!document.hidden);
    document.addEventListener("visibilitychange", onVis);
    onVis();
    return () => document.removeEventListener("visibilitychange", onVis);
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
    if (!mounted || !showHere || !tabVisible) return;

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
    const iv = window.setInterval(poll, jitterMs(90_000, 150_000));
    return () => window.clearInterval(iv);
  }, [mounted, showHere, tabVisible, bootstrap.windowDays, bootstrap.showAggregate, bootstrap.aggregateHours]);

  const current = items[index];
  const relativeLabel = useMemo(() => {
    if (!current) return "";
    try {
      return formatDistanceToNow(new Date(current.completedAtIso), { addSuffix: true });
    } catch {
      return "";
    }
  }, [current]);

  if (!mounted || !showHere || snoozed || !current) return null;

  const showFomo =
    bootstrap.showAggregate &&
    typeof aggregateCount === "number" &&
    aggregateCount > 0 &&
    (aggregateHours ?? bootstrap.aggregateHours ?? 0) > 0;

  const letter = avatarLetter(current.displayName);

  const card = (
    <div className="flex max-w-[min(92vw,22rem)] items-stretch gap-3 rounded-2xl border border-[var(--border)] bg-[var(--background)] py-3 pl-3 pr-2 shadow-2xl">
      <div
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-sky-100 text-base font-semibold text-sky-900 dark:bg-sky-950/50 dark:text-sky-100"
        aria-hidden
      >
        {letter}
      </div>
      <div className="min-w-0 flex-1 pt-0.5">
        <p className="truncate font-semibold leading-tight text-[var(--foreground)]">{current.displayName}</p>
        <p className="mt-0.5 text-sm leading-snug text-[var(--muted-foreground)]">{current.actionLine}</p>
        {current.locationLine ? (
          <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">{current.locationLine}</p>
        ) : null}
        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-[var(--muted-foreground)]">
          {relativeLabel ? <span>{relativeLabel}</span> : null}
          {relativeLabel ? <span aria-hidden>·</span> : null}
          <span className="inline-flex items-center gap-1 text-sky-700 dark:text-sky-400">
            <ShieldCheck className="h-3.5 w-3.5 shrink-0" aria-hidden />
            <span className="font-medium">Live orders · {brandLabel}</span>
          </span>
        </div>
        {showFomo ? (
          <p className="mt-2 text-xs font-medium text-[var(--foreground)]">
            {aggregateCount} orders in the last {aggregateHours ?? bootstrap.aggregateHours} hours
          </p>
        ) : null}
      </div>
      <button
        type="button"
        className="self-start rounded-md p-1.5 text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
        aria-label="Hide notifications for a few hours"
        onClick={() => {
          snoozeForHours(4);
          setSnoozed(true);
        }}
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );

  return (
    <div role="status" aria-live="polite" className="pointer-events-none fixed bottom-4 left-4 z-[70]">
      {reduceMotion ? (
        <div className="pointer-events-auto" key={`${current.completedAtIso}:${current.message}`}>
          {card}
        </div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={`${current.completedAtIso}:${current.message}`}
            className="pointer-events-auto"
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.99 }}
            transition={{ duration: 0.35 }}
          >
            {card}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
