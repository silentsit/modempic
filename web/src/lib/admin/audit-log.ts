import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";

export type AdminAuditInput = {
  actorId?: string | null;
  actorEmail?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  summary: string;
  changes?: Prisma.InputJsonValue;
};

export async function recordAdminAudit(input: AdminAuditInput): Promise<void> {
  try {
    await prisma.adminAuditLog.create({
      data: {
        actorId: input.actorId ?? null,
        actorEmail: input.actorEmail ?? null,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId ?? null,
        summary: input.summary,
        changes: input.changes ?? undefined,
      },
    });
  } catch (err) {
    console.error("[admin-audit] failed to record", input.action, err);
  }
}

export async function listRecentAdminAudit(limit = 50) {
  return prisma.adminAuditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}
