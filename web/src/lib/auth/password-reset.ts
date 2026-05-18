import { randomBytes, createHash } from "node:crypto";
import { prisma } from "@/lib/db";
import { getSiteUrl } from "@/lib/site-url";
import { sendPasswordResetEmail } from "@/lib/email/send";

/** Emails a reset link. Works for existing passwords and for OAuth/imported users without one (sets password on use). */
export async function sendPasswordResetForEmail(
  email: string,
): Promise<{ sent: boolean; isSetPassword: boolean }> {
  const lower = email.toLowerCase();
  const user = await prisma.user.findUnique({ where: { email: lower } });
  if (!user) return { sent: false, isSetPassword: false };

  const isSetPassword = !user.passwordHash;

  const token = randomBytes(32).toString("hex");
  const hashed = createHash("sha256").update(token).digest("hex");
  const expires = new Date(Date.now() + 1000 * 60 * 60);

  await prisma.$transaction([
    prisma.verificationToken.deleteMany({ where: { identifier: `reset:${lower}` } }),
    prisma.verificationToken.create({
      data: { identifier: `reset:${lower}`, token: hashed, expires },
    }),
  ]);

  const base = getSiteUrl();
  const link = `${base}/reset-password?token=${token}&email=${encodeURIComponent(lower)}`;
  await sendPasswordResetEmail(lower, link, { isSetPassword });
  return { sent: true, isSetPassword };
}
