import { prisma } from "@/lib/db";
import { Role } from "@prisma/client";

export async function resolveGuestCheckoutUser(input: {
  email: string;
  name: string;
}): Promise<{ ok: true; user: { id: string; email: string; name: string | null } } | { ok: false; error: string }> {
  const email = input.email.trim().toLowerCase();
  const name = input.name.trim().slice(0, 120) || null;
  if (!email) return { ok: false, error: "Enter an email so we can send order updates." };

  const existing = await prisma.user.findUnique({
    where: { email },
    include: { accounts: { select: { id: true }, take: 1 } },
  });

  if (existing?.bannedAt) {
    return { ok: false, error: "This email cannot be used for checkout." };
  }

  if (existing && (existing.passwordHash || existing.accounts.length > 0)) {
    return {
      ok: false,
      error: "An account with this email already exists. Sign in to finish checkout.",
    };
  }

  if (existing) {
    if (name && !existing.name) {
      await prisma.user.update({ where: { id: existing.id }, data: { name } });
    }
    return { ok: true, user: { id: existing.id, email, name: name ?? existing.name } };
  }

  const created = await prisma.user.create({
    data: { email, name, role: Role.CUSTOMER },
  });
  return { ok: true, user: { id: created.id, email, name: created.name } };
}

export async function adoptPasswordlessGuestUser(email: string, name: string, passwordHash: string) {
  const existing = await prisma.user.findUnique({
    where: { email },
    include: { accounts: { select: { id: true }, take: 1 } },
  });
  if (!existing) return null;
  if (existing.passwordHash || existing.accounts.length > 0) return null;
  return prisma.user.update({
    where: { id: existing.id },
    data: { passwordHash, name },
  });
}
