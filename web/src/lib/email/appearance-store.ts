import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { normalizeEmailAppearance, type EmailAppearance } from "@/lib/email/email-appearance";

export const EMAIL_APPEARANCE_STORE_KEY = "email_appearance";

export async function getEmailAppearanceForSend(): Promise<EmailAppearance> {
  try {
    const row = await prisma.storeSetting.findUnique({ where: { key: EMAIL_APPEARANCE_STORE_KEY } });
    return normalizeEmailAppearance(row?.value ?? {});
  } catch {
    return normalizeEmailAppearance({});
  }
}

export async function persistEmailAppearance(appearance: EmailAppearance): Promise<void> {
  const value = appearance as unknown as Prisma.InputJsonValue;
  await prisma.storeSetting.upsert({
    where: { key: EMAIL_APPEARANCE_STORE_KEY },
    create: { key: EMAIL_APPEARANCE_STORE_KEY, value },
    update: { value },
  });
}
