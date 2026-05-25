import {
  SocialProofNotificationStatus as PrismaStatus,
  SocialProofNotificationType as PrismaType,
} from "@prisma/client";
import { prisma } from "@/lib/db";
import {
  DEFAULT_STORE,
  notificationConfigSchema,
  notificationSchema,
  parseSocialProofStore,
  SOCIAL_PROOF_STORE_KEY,
  type SocialProofNotification,
  type SocialProofStatus,
  type SocialProofStore,
  type SocialProofType,
} from "./schema";

const TYPE_TO_PRISMA: Record<SocialProofType, PrismaType> = {
  stream: PrismaType.STREAM,
  combo: PrismaType.COMBO,
  informational: PrismaType.INFORMATIONAL,
  reviews: PrismaType.REVIEWS,
  counter: PrismaType.COUNTER,
};

const TYPE_FROM_PRISMA: Record<PrismaType, SocialProofType> = {
  [PrismaType.STREAM]: "stream",
  [PrismaType.COMBO]: "combo",
  [PrismaType.INFORMATIONAL]: "informational",
  [PrismaType.REVIEWS]: "reviews",
  [PrismaType.COUNTER]: "counter",
};

const STATUS_TO_PRISMA: Record<SocialProofStatus, PrismaStatus> = {
  draft: PrismaStatus.DRAFT,
  active: PrismaStatus.ACTIVE,
  paused: PrismaStatus.PAUSED,
};

const STATUS_FROM_PRISMA: Record<PrismaStatus, SocialProofStatus> = {
  [PrismaStatus.DRAFT]: "draft",
  [PrismaStatus.ACTIVE]: "active",
  [PrismaStatus.PAUSED]: "paused",
};

function rowToNotification(row: {
  id: string;
  name: string;
  type: PrismaType;
  status: PrismaStatus;
  priority: number;
  config: unknown;
  createdAt: Date;
  updatedAt: Date;
}): SocialProofNotification {
  return notificationSchema.parse({
    id: row.id,
    name: row.name,
    type: TYPE_FROM_PRISMA[row.type],
    status: STATUS_FROM_PRISMA[row.status],
    priority: row.priority,
    config: notificationConfigSchema.parse(row.config),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  });
}

async function loadJsonStore(): Promise<SocialProofStore> {
  try {
    const row = await prisma.storeSetting.findUnique({ where: { key: SOCIAL_PROOF_STORE_KEY } });
    if (!row?.value) return DEFAULT_STORE;
    return parseSocialProofStore(row.value);
  } catch {
    return DEFAULT_STORE;
  }
}

async function saveJsonStore(store: SocialProofStore): Promise<void> {
  await prisma.storeSetting.upsert({
    where: { key: SOCIAL_PROOF_STORE_KEY },
    create: { key: SOCIAL_PROOF_STORE_KEY, value: store as object },
    update: { value: store as object },
  });
}

/** One-time import from legacy StoreSetting JSON when Prisma table is empty. */
export async function migrateSocialProofJsonToPrismaIfNeeded(): Promise<boolean> {
  const count = await prisma.socialProofNotification.count();
  if (count > 0) return false;

  const jsonStore = await loadJsonStore();
  if (jsonStore.notifications.length === 0) return false;

  for (const n of jsonStore.notifications) {
    const parsed = notificationSchema.parse(n);
    await prisma.socialProofNotification.create({
      data: {
        id: parsed.id,
        name: parsed.name,
        type: TYPE_TO_PRISMA[parsed.type],
        status: STATUS_TO_PRISMA[parsed.status],
        priority: parsed.priority,
        config: parsed.config as object,
        createdAt: parsed.createdAt ? new Date(parsed.createdAt) : new Date(),
        updatedAt: parsed.updatedAt ? new Date(parsed.updatedAt) : new Date(),
      },
    });
  }
  return true;
}

export async function loadSocialProofStoreFromPrisma(): Promise<SocialProofStore | null> {
  await migrateSocialProofJsonToPrismaIfNeeded();

  const count = await prisma.socialProofNotification.count();
  if (count === 0) return null;

  const [rows, globalRow] = await Promise.all([
    prisma.socialProofNotification.findMany({ orderBy: [{ priority: "asc" }, { name: "asc" }] }),
    prisma.storeSetting.findUnique({ where: { key: SOCIAL_PROOF_STORE_KEY } }),
  ]);

  const jsonGlobal = globalRow?.value ? parseSocialProofStore(globalRow.value).global : DEFAULT_STORE.global;

  return {
    global: jsonGlobal,
    notifications: rows.map(rowToNotification),
  };
}

export async function saveSocialProofStoreToPrisma(store: SocialProofStore): Promise<void> {
  await migrateSocialProofJsonToPrismaIfNeeded();

  const existingIds = new Set(
    (await prisma.socialProofNotification.findMany({ select: { id: true } })).map((r) => r.id),
  );
  const nextIds = new Set(store.notifications.map((n) => n.id));

  for (const id of existingIds) {
    if (!nextIds.has(id)) {
      await prisma.socialProofNotification.delete({ where: { id } });
    }
  }

  for (const n of store.notifications) {
    const parsed = notificationSchema.parse(n);
    await prisma.socialProofNotification.upsert({
      where: { id: parsed.id },
      create: {
        id: parsed.id,
        name: parsed.name,
        type: TYPE_TO_PRISMA[parsed.type],
        status: STATUS_TO_PRISMA[parsed.status],
        priority: parsed.priority,
        config: parsed.config as object,
        createdAt: parsed.createdAt ? new Date(parsed.createdAt) : new Date(),
        updatedAt: parsed.updatedAt ? new Date(parsed.updatedAt) : new Date(),
      },
      update: {
        name: parsed.name,
        type: TYPE_TO_PRISMA[parsed.type],
        status: STATUS_TO_PRISMA[parsed.status],
        priority: parsed.priority,
        config: parsed.config as object,
        updatedAt: parsed.updatedAt ? new Date(parsed.updatedAt) : new Date(),
      },
    });
  }

  await saveJsonStore({ global: store.global, notifications: [] });
}
