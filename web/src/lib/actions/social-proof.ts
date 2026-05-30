"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireStaff } from "@/lib/auth/admin";
import { loadSocialProofStore, saveSocialProofStore } from "@/lib/social-proof/config";
import { saveSocialProofAnalyticsStore } from "@/lib/social-proof/analytics-store";
import { DEFAULT_ANALYTICS_STORE } from "@/lib/social-proof/analytics-schema";
import {
  createDefaultComboNotification,
  createDefaultCounterNotification,
  createDefaultStreamNotification,
  DEFAULT_NOTIFICATION_CONFIG,
  DEFAULT_SOCIAL_PROOF_EXCLUDE_PATHS,
  fallbackModeSchema,
  globalConfigSchema,
  notificationConfigSchema,
  notificationSchema,
  socialProofStatusSchema,
  socialProofTypeSchema,
  type SocialProofNotification,
} from "@/lib/social-proof/schema";

function revalidateSocialProof() {
  revalidatePath("/admin/social-proof");
  revalidatePath("/admin/social-proof/events");
  revalidatePath("/admin/campaigns");
  revalidatePath("/");
  revalidatePath("/shop");
}

function parseCheckbox(formData: FormData, key: string): boolean {
  return formData.get(key) === "on" || formData.get(key) === "1" || formData.get(key) === "true";
}

function parseIntField(raw: FormDataEntryValue | null, fallback: number, min: number, max: number): number {
  const n = Number(String(raw ?? ""));
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.floor(n)));
}

function parsePaths(raw: string): string[] {
  return raw
    .split(/[\n,]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export async function updateSocialProofGlobalAction(formData: FormData) {
  await requireStaff();
  const store = await loadSocialProofStore();

  const enabled = parseCheckbox(formData, "enabled");
  const debugMode = parseCheckbox(formData, "debugMode");
  const brandLabel = String(formData.get("brandLabel") ?? "").trim() || "Modempic";
  const fallbackRaw = String(formData.get("fallbackMode") ?? "auto");
  const fallbackParsed = fallbackModeSchema.safeParse(fallbackRaw);
  const fallbackMode = fallbackParsed.success ? fallbackParsed.data : "auto";

  store.global = globalConfigSchema.parse({
    ...store.global,
    enabled,
    debugMode,
    brandLabel,
    fallbackMode,
    demoItems: store.global.demoItems,
  });

  await saveSocialProofStore(store);
  revalidateSocialProof();
  redirect("/admin/social-proof?notice=global_saved");
}

export async function upsertSocialProofNotificationAction(formData: FormData) {
  await requireStaff();
  const store = await loadSocialProofStore();

  const id = String(formData.get("id") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) redirect("/admin/social-proof?notice=name_required");

  const typeParsed = socialProofTypeSchema.safeParse(String(formData.get("type") ?? "stream"));
  const statusParsed = socialProofStatusSchema.safeParse(String(formData.get("status") ?? "draft"));
  const type = typeParsed.success ? typeParsed.data : "stream";
  const status = statusParsed.success ? statusParsed.data : "draft";

  const mobilePositionRaw = String(formData.get("mobilePosition") ?? "").trim();
  const mobilePosition = mobilePositionRaw || undefined;

  let informational;
  if (type === "informational") {
    const title = String(formData.get("infoTitle") ?? "").trim();
    const body = String(formData.get("infoBody") ?? "").trim();
    const linkUrl = String(formData.get("infoLinkUrl") ?? "").trim();
    if (!title || !body) redirect("/admin/social-proof?notice=name_required");
    informational = {
      title,
      body,
      icon: String(formData.get("infoIcon") ?? "shield"),
      ...(linkUrl ? { linkUrl } : {}),
    };
  }

  const comboMessage =
    type === "combo" ? String(formData.get("comboMessage") ?? "visited our store").trim() : undefined;

  let reviews;
  if (type === "reviews") {
    reviews = {
      minRating: parseIntField(formData.get("reviewsMinRating"), 4, 1, 5),
      take: parseIntField(formData.get("reviewsTake"), 8, 1, 15),
      windowDays: parseIntField(formData.get("reviewsWindowDays"), 30, 1, 90),
    };
  }

  let counter;
  if (type === "counter") {
    const scopeRaw = String(formData.get("counterScope") ?? "page");
    counter = {
      scope: scopeRaw === "site" ? ("site" as const) : ("page" as const),
      windowMinutes: parseIntField(formData.get("counterWindowMinutes"), 5, 1, 30),
      minDisplay: parseIntField(formData.get("counterMinDisplay"), 2, 1, 50),
      message: String(formData.get("counterMessage") ?? "visitors are online").trim(),
    };
  }

  const config = notificationConfigSchema.parse({
    windowDays: parseIntField(formData.get("windowDays"), DEFAULT_NOTIFICATION_CONFIG.windowDays, 1, 14),
    aggregateHours: parseIntField(
      formData.get("aggregateHours"),
      DEFAULT_NOTIFICATION_CONFIG.aggregateHours ?? 24,
      1,
      720,
    ),
    paths: parsePaths(String(formData.get("paths") ?? "/,/shop,/product")),
    excludePaths: parsePaths(
      String(formData.get("excludePaths") ?? DEFAULT_SOCIAL_PROOF_EXCLUDE_PATHS.join("\n")),
    ),
    mobileEnabled: parseCheckbox(formData, "mobileEnabled"),
    position: String(formData.get("position") ?? "bottom-left"),
    ...(mobilePosition ? { mobilePosition } : {}),
    showLocation: parseCheckbox(formData, "showLocation"),
    showProductImage: parseCheckbox(formData, "showProductImage"),
    maxAgeHours: parseIntField(formData.get("maxAgeHours"), DEFAULT_NOTIFICATION_CONFIG.maxAgeHours, 1, 720),
    initialDelaySec: parseIntField(formData.get("initialDelaySec"), DEFAULT_NOTIFICATION_CONFIG.initialDelaySec, 0, 120),
    displayDurationSec: parseIntField(
      formData.get("displayDurationSec"),
      DEFAULT_NOTIFICATION_CONFIG.displayDurationSec,
      2,
      60,
    ),
    gapBetweenSec: parseIntField(formData.get("gapBetweenSec"), DEFAULT_NOTIFICATION_CONFIG.gapBetweenSec, 1, 120),
    loop: parseCheckbox(formData, "loop"),
    dismissible: parseCheckbox(formData, "dismissible"),
    snoozeHours: parseIntField(formData.get("snoozeHours"), DEFAULT_NOTIFICATION_CONFIG.snoozeHours, 1, 168),
    clickable: parseCheckbox(formData, "clickable"),
    roundedPx: parseIntField(formData.get("roundedPx"), DEFAULT_NOTIFICATION_CONFIG.roundedPx, 0, 32),
    ...(informational ? { informational } : {}),
    ...(comboMessage ? { comboMessage } : {}),
    ...(reviews ? { reviews } : {}),
    ...(counter ? { counter } : {}),
  });

  const priority = parseIntField(formData.get("priority"), 0, 0, 999);
  const now = new Date().toISOString();

  let notification: SocialProofNotification;
  if (id) {
    const existing = store.notifications.find((n) => n.id === id);
    if (!existing) redirect("/admin/social-proof?notice=not_found");
    notification = notificationSchema.parse({
      ...existing,
      name,
      type,
      status,
      priority,
      config,
      updatedAt: now,
    });
    store.notifications = store.notifications.map((n) => (n.id === id ? notification : n));
  } else {
    notification = notificationSchema.parse({
      id: crypto.randomUUID(),
      name,
      type,
      status,
      priority,
      config,
      createdAt: now,
      updatedAt: now,
    });
    store.notifications.push(notification);
  }

  await saveSocialProofStore(store);
  revalidateSocialProof();
  redirect(`/admin/social-proof?notice=saved`);
}

export async function toggleSocialProofNotificationAction(formData: FormData) {
  await requireStaff();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const store = await loadSocialProofStore();
  const target = store.notifications.find((n) => n.id === id);
  if (!target) redirect("/admin/social-proof?notice=not_found");

  target.status = target.status === "active" ? "paused" : "active";
  target.updatedAt = new Date().toISOString();

  await saveSocialProofStore(store);
  revalidateSocialProof();
  redirect("/admin/social-proof?notice=toggled");
}

export async function deleteSocialProofNotificationAction(formData: FormData) {
  await requireStaff();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const store = await loadSocialProofStore();
  store.notifications = store.notifications.filter((n) => n.id !== id);
  await saveSocialProofStore(store);
  revalidateSocialProof();
  redirect("/admin/social-proof?notice=deleted");
}

export async function createDefaultSocialProofNotificationAction() {
  await requireStaff();
  const store = await loadSocialProofStore();
  const stream = createDefaultStreamNotification("Recent purchases");
  const combo = createDefaultComboNotification("Store visitors");
  const counter = createDefaultCounterNotification("Live visitors");
  store.notifications.push(stream, combo, counter);
  if (!store.global.enabled) {
    store.global.enabled = true;
  }
  await saveSocialProofStore(store);
  revalidateSocialProof();
  redirect(`/admin/social-proof?notice=created_default`);
}

export async function resetSocialProofAnalyticsAction() {
  await requireStaff();
  await saveSocialProofAnalyticsStore(DEFAULT_ANALYTICS_STORE);
  revalidateSocialProof();
  redirect("/admin/social-proof?notice=analytics_reset");
}
