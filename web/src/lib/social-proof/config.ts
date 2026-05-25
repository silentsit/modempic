import { prisma } from "@/lib/db";
import {
  createDefaultStreamNotification,
  DEFAULT_STORE,
  parseSocialProofStore,
  SOCIAL_PROOF_STORE_KEY,
  type SocialProofGlobalConfig,
  type SocialProofNotification,
  type SocialProofStore,
} from "./schema";
import {
  loadSocialProofStoreFromPrisma,
  saveSocialProofStoreToPrisma,
} from "./prisma-store";

async function loadJsonStoreOnly(): Promise<SocialProofStore> {
  try {
    const row = await prisma.storeSetting.findUnique({ where: { key: SOCIAL_PROOF_STORE_KEY } });
    if (!row?.value) return DEFAULT_STORE;
    return parseSocialProofStore(row.value);
  } catch {
    return DEFAULT_STORE;
  }
}

async function saveJsonStoreOnly(store: SocialProofStore): Promise<void> {
  await prisma.storeSetting.upsert({
    where: { key: SOCIAL_PROOF_STORE_KEY },
    create: { key: SOCIAL_PROOF_STORE_KEY, value: store as object },
    update: { value: store as object },
  });
}

export async function loadSocialProofStore(): Promise<SocialProofStore> {
  try {
    const fromPrisma = await loadSocialProofStoreFromPrisma();
    if (fromPrisma) return fromPrisma;
    return loadJsonStoreOnly();
  } catch {
    return DEFAULT_STORE;
  }
}

export async function saveSocialProofStore(store: SocialProofStore): Promise<void> {
  const prismaCount = await prisma.socialProofNotification.count().catch(() => 0);
  if (prismaCount > 0 || store.notifications.length > 0) {
    await saveSocialProofStoreToPrisma(store);
    await saveJsonStoreOnly({ global: store.global, notifications: [] });
    return;
  }
  await saveJsonStoreOnly(store);
}

/** Enabled when admin toggle is on or legacy env flag is set. */
export function isSocialProofGloballyEnabled(global: SocialProofGlobalConfig): boolean {
  if (global.enabled) return true;
  return process.env.NEXT_PUBLIC_SOCIAL_PROOF_ENABLED === "1";
}

function sortActive(notifications: SocialProofNotification[]): SocialProofNotification[] {
  return [...notifications].sort((a, b) => a.priority - b.priority || a.name.localeCompare(b.name));
}

export function pickActiveStreamNotification(store: SocialProofStore): SocialProofNotification | null {
  const active = sortActive(store.notifications.filter((n) => n.status === "active" && n.type === "stream"));
  if (active[0]) return active[0];
  if (isSocialProofGloballyEnabled(store.global) && store.notifications.length === 0) {
    return createDefaultStreamNotification("Recent purchases (legacy env)");
  }
  return null;
}

export function pickActiveComboNotification(store: SocialProofStore): SocialProofNotification | null {
  return sortActive(store.notifications.filter((n) => n.status === "active" && n.type === "combo"))[0] ?? null;
}

export function pickActiveCounterNotification(store: SocialProofStore): SocialProofNotification | null {
  return sortActive(store.notifications.filter((n) => n.status === "active" && n.type === "counter"))[0] ?? null;
}

export function pickActiveInformationalNotifications(store: SocialProofStore): SocialProofNotification[] {
  return sortActive(
    store.notifications.filter((n) => n.status === "active" && n.type === "informational" && n.config.informational),
  );
}

export function pickActiveReviewsNotifications(store: SocialProofStore): SocialProofNotification[] {
  return sortActive(store.notifications.filter((n) => n.status === "active" && n.type === "reviews"));
}

/** Primary notification that supplies display/timing config for the storefront widget. */
export function pickPrimaryDisplayNotification(store: SocialProofStore): SocialProofNotification | null {
  const stream = pickActiveStreamNotification(store);
  if (stream && stream.type === "stream") return stream;

  const informational = pickActiveInformationalNotifications(store)[0];
  if (informational) return informational;

  const reviews = pickActiveReviewsNotifications(store)[0];
  if (reviews) return reviews;

  const combo = pickActiveComboNotification(store);
  if (combo) return combo;

  const counter = pickActiveCounterNotification(store);
  if (counter) return counter;

  return stream;
}

export function findNotificationById(store: SocialProofStore, id: string): SocialProofNotification | null {
  return store.notifications.find((n) => n.id === id) ?? null;
}
