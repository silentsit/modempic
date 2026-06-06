"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { usePathname } from "next/navigation";
import { pathnameShowsSocialProofWithRules } from "@/lib/social-proof/path-matching";
import { getSocialProofDisplayCount } from "@/lib/social-proof/display-count";
import type { SocialProofSlide } from "@/lib/social-proof/slides";
import type { ComboSlideDto, StreamAggregateDto } from "@/lib/social-proof/stream-aggregates";
import type { SocialProofBootstrap } from "@/lib/social-proof/types";
import { POSITION_CLASS } from "@/lib/social-proof/widget/constants";
import { getOrCreatePresenceSessionId } from "@/lib/social-proof/widget/presence-session";
import { jitterMs, readSnoozeUntil, snoozeForHours } from "@/lib/social-proof/widget/snooze";
import { rebuildActivitySlides, type ActivityApiItem } from "@/lib/social-proof/widget/slide-builders";
import { NotificationCard } from "./notification-card";
import { sendSocialProofEvent } from "@/lib/social-proof/track-event-client";

type ApiShape = {
  items: ActivityApiItem[];
  streamAggregates?: StreamAggregateDto[];
  comboSlides?: ComboSlideDto[];
};

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
