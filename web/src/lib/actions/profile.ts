"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export type ProfileState = { error?: string; success?: string } | null;

export async function updateProfileAction(_p: ProfileState, formData: FormData): Promise<ProfileState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Sign in required." };
  const name = z.string().min(1).max(120).safeParse(String(formData.get("name") ?? ""));
  if (!name.success) return { error: "Enter a name." };
  await prisma.user.update({ where: { id: session.user.id }, data: { name: name.data } });
  revalidatePath("/account");
  return { success: "Profile updated." };
}

export async function changePasswordAction(_p: ProfileState, formData: FormData): Promise<ProfileState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Sign in required." };
  const current = String(formData.get("currentPassword") ?? "");
  const next = String(formData.get("newPassword") ?? "");
  if (next.length < 8) return { error: "New password must be at least 8 characters." };
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user?.passwordHash) return { error: "Password change not available for this sign-in method." };
  const ok = await bcrypt.compare(current, user.passwordHash);
  if (!ok) return { error: "Current password is incorrect." };
  const passwordHash = await bcrypt.hash(next, 12);
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });
  return { success: "Password changed." };
}
