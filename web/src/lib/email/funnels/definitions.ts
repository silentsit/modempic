import type { EmailFunnelType } from "@prisma/client";

/** Send delays only — copy is editable in /admin/emails. */
export const FUNNEL_STEP_DELAYS: Record<EmailFunnelType, readonly number[]> = {
  WELCOME_SIGNUP: [0, 24, 72, 168],
  ABANDONED_CART: [1, 24, 48, 72, 120],
  UNPAID_ORDER: [1, 24, 48, 72],
};

export function funnelStepCount(funnelType: EmailFunnelType): number {
  return FUNNEL_STEP_DELAYS[funnelType].length;
}

export function hoursToMs(hours: number): number {
  return hours * 60 * 60 * 1000;
}

/** Next send time after a step is delivered (delay is from previous send, not enrollment). */
export function nextSendAtAfterStep(stepIndex: number, funnelType: EmailFunnelType, from = new Date()): Date | null {
  const delays = FUNNEL_STEP_DELAYS[funnelType];
  const nextStep = delays[stepIndex + 1];
  if (nextStep == null) return null;
  return new Date(from.getTime() + hoursToMs(nextStep));
}

export function funnelTemplateKey(funnelType: EmailFunnelType, stepIndex: number): string {
  return `funnel-${funnelType.toLowerCase()}-step-${stepIndex}`;
}
