"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { usePathname } from "next/navigation";
import { pathnameShowsSocialProofWithRules } from "@/lib/social-proof/path-matching";
import { getSocialProofDisplayCount } from "@/lib/social-proof/display-count";
import type { SocialProofPosition } from "@/lib/social-proof/schema";
import type { SocialProofSlide } from "@/lib/social-proof/slides";
import type { ComboSlideDto, StreamAggregateDto } from "@/lib/social-proof/stream-aggregates";
import type { SocialProofBootstrap } from "@/lib/social-proof/types";
import { NotificationCard } from "./notification-card";
import { sendSocialProofEvent } from "@/lib/social-proof/track-event-client";

type ApiShape = {
  items: Array<{
    message: string;
    completedAtIso: string;
    displayName: string;
    actionLine: string;
    locationLine?: string | null;
    productHint?: string;
    productSlug?: string;
    productImageUrl?: string;
    timeLabel?: string;
  }>;
  streamAggregates?: StreamAggregateDto[];
  comboSlides?: ComboSlideDto[];
};

const DISMISS_SESSION_KEY = "modempic_social_proof_snooze_until";

const POSITION_CLASS: Record<SocialProofPosition, string> = {
  "bottom-left": "bottom-4 left-4 max-sm:bottom-3 max-sm:left-3",
  "bottom-right": "bottom-4 right-4 max-sm:bottom-3 max-sm:right-3",
  "top-left": "top-[4.75rem] left-4 max-sm:top-[4.25rem] max-sm:left-3",
  "top-right": "top-[4.75rem] right-4 max-sm:top-[4.25rem] max-sm:right-3",
};

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

function useIsMobile(breakpoint = 640): boolean {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    const update = () => setMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, [breakpoint]);
  return mobile;
}

const PRESENCE_SESSION_KEY = "modempic_social_proof_session";

function getOrCreatePresenceSessionId(): string {
  try {
    const existing = sessionStorage.getItem(PRESENCE_SESSION_KEY);
    if (existing?.trim()) return existing.trim();
    const id =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `s-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    sessionStorage.setItem(PRESENCE_SESSION_KEY, id);
    return id;
  } catch {
    return `s-${Date.now()}`;
  }
}

function aggregatesToSlides(
  aggregates: StreamAggregateDto[],
  streamNotificationId?: string,
): SocialProofSlide[] {
  return aggregates.map((agg, aggIdx) => ({
    kind: "purchase_aggregate" as const,
    key: `aggregate-${agg.productSlug ?? agg.productHint}-${agg.windowHours}-${aggIdx}`,
    notificationId: streamNotificationId,
    count: agg.count,
    productHint: agg.productHint,
    ...(agg.productSlug ? { productSlug: agg.productSlug } : {}),
    ...(agg.productImageUrl ? { productImageUrl: agg.productImageUrl } : {}),
    windowLabel: agg.windowLabel,
  }));
}

function interleaveActivityAndAggregates(
  activitySlides: SocialProofSlide[],
  aggregateSlides: SocialProofSlide[],
): SocialProofSlide[] {
  if (!aggregateSlides.length) return activitySlides;
  const result: SocialProofSlide[] = [];
  let aggIdx = 0;
  const interval = Math.max(1, Math.floor(activitySlides.length / (aggregateSlides.length + 1)));

  for (let i = 0; i < activitySlides.length; i++) {
    result.push(activitySlides[i]!);
    if ((i + 1) % interval === 0 && aggIdx < aggregateSlides.length) {
      result.push(aggregateSlides[aggIdx]!);
      aggIdx++;
    }
  }
  while (aggIdx < aggregateSlides.length) {
    result.push(aggregateSlides[aggIdx]!);
    aggIdx++;
  }
  return result;
}

function comboSlidesToSlides(combos: ComboSlideDto[], comboNotificationId?: string): SocialProofSlide[] {
  return combos.map((combo, i) => ({
    kind: "combo" as const,
    key: combo.productSlug
      ? `combo-product-${combo.productSlug}-${combo.hours}-${i}`
      : `combo-site-${combo.hours}`,
    notificationId: comboNotificationId,
    count: combo.count,
    hours: combo.hours,
    windowLabel: combo.windowLabel,
    ...(combo.productHint ? { productHint: combo.productHint } : {}),
    ...(combo.productSlug ? { productSlug: combo.productSlug } : {}),
    ...(combo.productImageUrl ? { productImageUrl: combo.productImageUrl } : {}),
  }));
}

function rebuildActivitySlides(
  slides: SocialProofSlide[],
  items: ApiShape["items"],
  streamNotificationId: string | undefined,
  comboSlides?: ComboSlideDto[] | null,
  comboNotificationId?: string,
  counter?: { count: number; message: string; notificationId?: string } | null,
  streamAggregates?: StreamAggregateDto[],
): SocialProofSlide[] {
  const staticSlides = slides.filter((s) => s.kind === "informational" || s.kind === "review");
  const existingCounter = slides.find((s) => s.kind === "counter");
  const activitySlides: SocialProofSlide[] = items.map((item, index) => ({
    kind: "activity",
    key: `activity-${item.completedAtIso}-${index}`,
    notificationId: streamNotificationId,
    item,
  }));

  const aggregateSlides =
    streamAggregates?.length
      ? aggregatesToSlides(streamAggregates, streamNotificationId)
      : slides.filter((s) => s.kind === "purchase_aggregate");

  const interleaved = interleaveActivityAndAggregates(activitySlides, aggregateSlides);
  const next: SocialProofSlide[] = [...interleaved];

  const comboSlideList =
    comboSlides?.length
      ? comboSlidesToSlides(comboSlides, comboNotificationId)
      : slides.filter((s) => s.kind === "combo");

  for (let i = comboSlideList.length - 1; i >= 0; i--) {
    next.unshift(comboSlideList[i]!);
  }

  // Match buildSocialProofSlides: combo first, then counter (counter ends up first in rotation).
  if (counter && counter.count > 0) {
    next.unshift({
      kind: "counter",
      key: "counter-live",
      notificationId: counter.notificationId,
      count: counter.count,
      message: counter.message,
    });
  } else if (existingCounter && !counter) {
    next.unshift(existingCounter);
  }
  return [...next, ...staticSlides];
}

function debugLog(debugMode: boolean, ...args: unknown[]) {
  if (debugMode) console.info("[social-proof]", ...args);
}

export function SocialProofWidget({ bootstrap }: { bootstrap: SocialProofBootstrap }) {
  const pathname = usePathname() ?? "/";
  const reduceMotion = useReducedMotion();
  const isMobile = useIsMobile();
  const cfg = bootstrap.notification.config;
  const showHere = pathnameShowsSocialProofWithRules(pathname, cfg.paths, cfg.excludePaths);
  const brandLabel = bootstrap.global.brandLabel.trim() || "Modempic";

  const resolvedPosition =
    isMobile && cfg.mobilePosition ? cfg.mobilePosition : cfg.position;
  const positionClass = POSITION_CLASS[resolvedPosition] ?? POSITION_CLASS["bottom-left"];

  const [mounted, setMounted] = useState(false);
  const [tabVisible, setTabVisible] = useState(true);
  const [snoozed, setSnoozed] = useState(false);
  const [slides, setSlides] = useState(bootstrap.slides);
  const [index, setIndex] = useState(0);
  const [cardVisible, setCardVisible] = useState(false);
  const [initialReady, setInitialReady] = useState(cfg.initialDelaySec <= 0);
  const [rotationDone, setRotationDone] = useState(false);
  const timersRef = useRef<number[]>([]);
  const lastImpressionKeyRef = useRef<string | null>(null);
  const debugMode = bootstrap.global.debugMode;
  const streamNotificationId = bootstrap.streamNotificationId ?? bootstrap.notification.id;
  const counterCfg = bootstrap.counterNotification;

  const clearTimers = () => {
    for (const id of timersRef.current) window.clearTimeout(id);
    timersRef.current = [];
  };

  const schedule = (fn: () => void, ms: number) => {
    const id = window.setTimeout(fn, ms);
    timersRef.current.push(id);
  };

  useEffect(() => {
    debugLog(debugMode, "mounted", { pathname, showHere, slideCount: slides.length, dataSource: bootstrap.dataSource });
  }, [debugMode, pathname, showHere, slides.length, bootstrap.dataSource]);

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
    if (!mounted || !showHere || snoozed || !tabVisible || !slides.length) {
      clearTimers();
      setCardVisible(false);
      setInitialReady(cfg.initialDelaySec <= 0);
      return;
    }

    clearTimers();
    setCardVisible(false);
    setInitialReady(false);
    schedule(() => setInitialReady(true), cfg.initialDelaySec * 1000);
    return () => clearTimers();
  }, [mounted, showHere, snoozed, tabVisible, slides.length, cfg.initialDelaySec]);

  useEffect(() => {
    if (!initialReady || !slides.length || snoozed || !showHere || !tabVisible || rotationDone) {
      if (rotationDone) setCardVisible(false);
      return;
    }

    clearTimers();
    setCardVisible(true);

    schedule(() => {
      setCardVisible(false);
      schedule(() => {
        setIndex((i) => {
          const next = i + 1;
          if (next >= slides.length) {
            if (!cfg.loop) {
              setRotationDone(true);
              return i;
            }
            return 0;
          }
          return next;
        });
      }, cfg.gapBetweenSec * 1000);
    }, cfg.displayDurationSec * 1000);

    return () => clearTimers();
  }, [
    initialReady,
    index,
    slides.length,
    snoozed,
    showHere,
    tabVisible,
    rotationDone,
    cfg.displayDurationSec,
    cfg.gapBetweenSec,
    cfg.loop,
  ]);

  useEffect(() => {
    if (!mounted || !showHere || !tabVisible) return;

    const poll = async () => {
      try {
        const qs = new URLSearchParams({ windowDays: String(bootstrap.windowDays), take: "15" });
        qs.set("aggregateHours", String(cfg.aggregateHours ?? 24));
        const res = await fetch(`/api/social-proof/activity?${qs}`, { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as ApiShape;
        if (!Array.isArray(data.items) || data.items.length === 0) return;
        const counter = counterCfg
          ? {
              count: getSocialProofDisplayCount(`counter:${counterCfg.id}`),
              message: counterCfg.message,
              notificationId: counterCfg.id,
            }
          : null;
        setSlides((prev) =>
          rebuildActivitySlides(
            prev,
            data.items,
            streamNotificationId,
            data.comboSlides,
            bootstrap.comboNotificationId,
            counter,
            data.streamAggregates,
          ),
        );
      } catch {
        /* ignore */
      }
    };

    poll();
    const iv = window.setInterval(poll, jitterMs(90_000, 150_000));
    return () => window.clearInterval(iv);
  }, [
    mounted,
    showHere,
    tabVisible,
    bootstrap.windowDays,
    cfg.aggregateHours,
    streamNotificationId,
    bootstrap.comboNotificationId,
    counterCfg,
  ]);

  useEffect(() => {
    if (!mounted || !showHere || !tabVisible || !counterCfg) return;

    const sessionId = getOrCreatePresenceSessionId();
    const ping = () => {
      void fetch("/api/social-proof/presence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, pathname }),
        keepalive: true,
      }).catch(() => undefined);
    };

    ping();
    const iv = window.setInterval(ping, 45_000);
    return () => window.clearInterval(iv);
  }, [mounted, showHere, tabVisible, counterCfg, pathname]);

  useEffect(() => {
    if (!mounted || !showHere || !tabVisible || !counterCfg) return;

    const count = getSocialProofDisplayCount(`counter:${counterCfg.id}`);
    setSlides((prev) => {
      const withoutCounter = prev.filter((s) => s.kind !== "counter");
      const counterSlide: SocialProofSlide = {
        kind: "counter",
        key: "counter-live",
        notificationId: counterCfg.id,
        count,
        message: counterCfg.message,
      };
      return [counterSlide, ...withoutCounter];
    });
  }, [mounted, showHere, tabVisible, counterCfg]);

  const current = slides[index];
  const trackNotificationId = current?.notificationId ?? bootstrap.notification.id;

  useEffect(() => {
    if (!cardVisible || !current || snoozed || !showHere) return;
    const dedupeKey = `${trackNotificationId}:${current.key}`;
    if (lastImpressionKeyRef.current === dedupeKey) return;
    lastImpressionKeyRef.current = dedupeKey;
    debugLog(debugMode, "impression", { slide: current.kind, key: current.key, pathname });
    sendSocialProofEvent({
      notificationId: trackNotificationId,
      event: "impression",
      pathname,
      slideKey: current.key,
    });
  }, [cardVisible, current, snoozed, showHere, trackNotificationId, pathname, debugMode]);

  if (!mounted || !showHere || snoozed || !current) return null;
  if (isMobile && !cfg.mobileEnabled) return null;
  if (!cardVisible && !initialReady) return null;

  const card = (
    <NotificationCard
      slide={current}
      cfg={cfg}
      brandLabel={brandLabel}
      dataSource={bootstrap.dataSource}
      comboMessage={bootstrap.comboMessage}
      onDismiss={() => {
        debugLog(debugMode, "dismiss", { slide: current.kind, snoozeHours: cfg.snoozeHours });
        sendSocialProofEvent({
          notificationId: trackNotificationId,
          event: "dismiss",
          pathname,
          slideKey: current.key,
        });
        snoozeForHours(cfg.snoozeHours);
        setSnoozed(true);
      }}
      onCardClick={() => {
        debugLog(debugMode, "click", { slide: current.kind, key: current.key });
        sendSocialProofEvent({
          notificationId: trackNotificationId,
          event: "click",
          pathname,
          slideKey: current.key,
        });
      }}
    />
  );

  return (
    <div role="status" aria-live="polite" className={`pointer-events-none fixed z-[70] ${positionClass}`}>
      {reduceMotion ? (
        cardVisible ? (
          <div className="pointer-events-auto" key={current.key}>
            {card}
          </div>
        ) : null
      ) : (
        <AnimatePresence mode="wait">
          {cardVisible ? (
            <motion.div
              key={current.key}
              className="pointer-events-auto"
              initial={{ opacity: 0, y: resolvedPosition.startsWith("top") ? -12 : 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: resolvedPosition.startsWith("top") ? -8 : 8, scale: 0.99 }}
              transition={{ duration: 0.35 }}
            >
              {card}
            </motion.div>
          ) : null}
        </AnimatePresence>
      )}
    </div>
  );
}
