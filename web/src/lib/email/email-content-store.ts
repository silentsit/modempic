import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { normalizeEmailContentSettings, type EmailContentSettings } from "@/lib/email/email-content";

export const EMAIL_CONTENT_STORE_KEY = "email_template_content";

export async function getEmailContentForSend(): Promise<EmailContentSettings> {
  try {
    const row = await prisma.storeSetting.findUnique({ where: { key: EMAIL_CONTENT_STORE_KEY } });
    return normalizeEmailContentSettings(row?.value ?? {});
  } catch {
    return normalizeEmailContentSettings({});
  }
}

export async function persistEmailContent(content: EmailContentSettings): Promise<void> {
  const value = content as unknown as Prisma.InputJsonValue;
  await prisma.storeSetting.upsert({
    where: { key: EMAIL_CONTENT_STORE_KEY },
    create: { key: EMAIL_CONTENT_STORE_KEY, value },
    update: { value },
  });
}
