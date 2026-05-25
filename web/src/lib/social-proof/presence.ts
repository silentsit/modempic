import { prisma } from "@/lib/db";

const DEFAULT_WINDOW_MINUTES = 5;

function minutesAgo(d: Date, minutes: number): Date {
  return new Date(d.getTime() - minutes * 60 * 1000);
}

export async function upsertSocialProofPresence(sessionId: string, pathname: string): Promise<void> {
  const cleanPath = pathname.trim().slice(0, 500) || "/";
  const cleanSession = sessionId.trim().slice(0, 64);
  if (!cleanSession) return;

  const now = new Date();
  await prisma.socialProofPresence.upsert({
    where: { sessionId_pathname: { sessionId: cleanSession, pathname: cleanPath } },
    create: { sessionId: cleanSession, pathname: cleanPath, lastSeenAt: now },
    update: { lastSeenAt: now },
  });
}

export async function countActiveSocialProofPresence(options: {
  pathname?: string;
  scope: "page" | "site";
  windowMinutes?: number;
}): Promise<number> {
  const windowMinutes = Math.min(30, Math.max(1, Math.floor(options.windowMinutes ?? DEFAULT_WINDOW_MINUTES)));
  const since = minutesAgo(new Date(), windowMinutes);

  return prisma.socialProofPresence.count({
    where: {
      lastSeenAt: { gte: since },
      ...(options.scope === "page" && options.pathname
        ? { pathname: options.pathname.trim().slice(0, 500) || "/" }
        : {}),
    },
  });
}

/** Remove stale heartbeats (older than 30 minutes). */
export async function pruneStaleSocialProofPresence(): Promise<void> {
  const cutoff = minutesAgo(new Date(), 30);
  await prisma.socialProofPresence.deleteMany({
    where: { lastSeenAt: { lt: cutoff } },
  });
}
