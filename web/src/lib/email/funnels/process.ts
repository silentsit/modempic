import { EmailFunnelStatus, EmailFunnelType } from "@prisma/client";
import { prisma } from "@/lib/db";
import { funnelStepCount, nextSendAtAfterStep } from "@/lib/email/funnels/definitions";
import { isFunnelEnrollmentEligible } from "@/lib/email/funnels/eligibility";
import { sendFunnelStepEmail } from "@/lib/email/funnels/send-step";

const BATCH_SIZE = 40;

export async function cancelFunnelEnrollment(funnelType: EmailFunnelType, referenceId: string) {
  await prisma.emailFunnelEnrollment.updateMany({
    where: { funnelType, referenceId, status: EmailFunnelStatus.ACTIVE },
    data: { status: EmailFunnelStatus.CANCELLED },
  });
}

export async function advanceEnrollmentAfterSend(enrollmentId: string) {
  const enrollment = await prisma.emailFunnelEnrollment.findUnique({ where: { id: enrollmentId } });
  if (!enrollment) return;

  const stepCount = funnelStepCount(enrollment.funnelType);
  const now = new Date();
  const nextStepIndex = enrollment.stepIndex + 1;
  const nextAt = nextSendAtAfterStep(enrollment.stepIndex, enrollment.funnelType, now);

  if (nextStepIndex >= stepCount || !nextAt) {
    await prisma.emailFunnelEnrollment.update({
      where: { id: enrollmentId },
      data: {
        stepIndex: nextStepIndex,
        lastSentAt: now,
        status: EmailFunnelStatus.COMPLETED,
        nextSendAt: now,
      },
    });
    return;
  }

  await prisma.emailFunnelEnrollment.update({
    where: { id: enrollmentId },
    data: {
      stepIndex: nextStepIndex,
      lastSentAt: now,
      nextSendAt: nextAt,
    },
  });
}

export type ProcessFunnelsResult = {
  processed: number;
  sent: number;
  cancelled: number;
  completed: number;
  failed: number;
  skipped: number;
};

export async function processDueEmailFunnels(now = new Date()): Promise<ProcessFunnelsResult> {
  const due = await prisma.emailFunnelEnrollment.findMany({
    where: { status: EmailFunnelStatus.ACTIVE, nextSendAt: { lte: now } },
    orderBy: { nextSendAt: "asc" },
    take: BATCH_SIZE,
  });

  const result: ProcessFunnelsResult = {
    processed: due.length,
    sent: 0,
    cancelled: 0,
    completed: 0,
    failed: 0,
    skipped: 0,
  };

  for (const enrollment of due) {
    const stepCount = funnelStepCount(enrollment.funnelType);
    if (enrollment.stepIndex >= stepCount) {
      await prisma.emailFunnelEnrollment.update({
        where: { id: enrollment.id },
        data: { status: EmailFunnelStatus.COMPLETED },
      });
      result.completed += 1;
      continue;
    }

    const eligible = await isFunnelEnrollmentEligible(enrollment.funnelType, enrollment.referenceId);
    if (!eligible) {
      await prisma.emailFunnelEnrollment.update({
        where: { id: enrollment.id },
        data: { status: EmailFunnelStatus.CANCELLED },
      });
      result.cancelled += 1;
      continue;
    }

    const sent = await sendFunnelStepEmail(enrollment);
    if (!sent.ok) {
      result.failed += 1;
      continue;
    }

    const before = enrollment.stepIndex;
    await advanceEnrollmentAfterSend(enrollment.id);
    const after = before + 1;
    if (after >= stepCount) {
      result.completed += 1;
    } else {
      result.sent += 1;
    }
  }

  return result;
}
