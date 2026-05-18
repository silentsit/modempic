import { randomBytes, createHash } from "node:crypto";
import { prisma } from "@/lib/db";
import { getSiteUrl } from "@/lib/site-url";
import { sendPasswordResetEmail } from "@/lib/email/send";

/** Creates a reset token and emails the link when the user has a password login. */
export async function sendPasswordResetForEmail(email: string): Promise<{ sent: boolean }> {
  const lower = email.toLowerCase();
  const user = await prisma.user.findUnique({ where: { email: lower } });
  if (!user?.passwordHash) return { sent: false };

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
  await sendPasswordResetEmail(lower, link);
  return { sent: true };
}
