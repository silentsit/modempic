"use server";

import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { signIn } from "@/auth";
import { randomBytes, createHash } from "node:crypto";
import { getSiteUrl } from "@/lib/site-url";
import { sendPasswordResetEmail } from "@/lib/email/send";

const registerSchema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email().max(255),
  password: z.string().min(8).max(128),
});

export type AuthFormState = { error?: string; success?: string; redirectTo?: string } | null;

/**
 * Limit post-register redirect to same-origin paths so a malicious `?callbackUrl=https://evil.com` can't be used as an open redirect.
 */
function safeCallbackPath(value: string | null | undefined): string {
  if (!value) return "/account";
  if (!value.startsWith("/") || value.startsWith("//")) return "/account";
  return value;
}

export async function registerAction(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const raw = {
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
  };
  const callbackUrl = safeCallbackPath(formData.get("callbackUrl") as string | null);
  const parsed = registerSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: "Please check your name, email, and password (8+ characters)." };
  }
  const { name, email, password } = parsed.data;
  const lower = email.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email: lower } });
  if (existing) {
    return { error: "An account with this email already exists. Try signing in." };
  }
  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.create({
    data: { name, email: lower, passwordHash },
  });
  const res = await signIn("credentials", { email: lower, password, redirect: false });
  if (res && typeof res === "object" && "error" in res && (res as { error?: string }).error) {
    const params = new URLSearchParams({ registered: "1", email: lower });
    if (callbackUrl !== "/account") params.set("callbackUrl", callbackUrl);
    return { redirectTo: `/login?${params.toString()}` };
  }
  return { redirectTo: callbackUrl };
}

const forgotSchema = z.object({ email: z.string().email() });

export async function requestPasswordResetAction(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "");
  const parsed = forgotSchema.safeParse({ email });
  if (!parsed.success) {
    return { error: "Enter a valid email address." };
  }
  const lower = parsed.data.email.toLowerCase();
  const user = await prisma.user.findUnique({ where: { email: lower } });
  if (!user || !user.passwordHash) {
    // Do not reveal whether email exists
    return { success: "If that email is registered, you will receive reset instructions." };
  }
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
  return { success: "If that email is registered, you will receive reset instructions." };
}

const resetSchema = z.object({
  email: z.string().email(),
  token: z.string().min(10),
  password: z.string().min(8).max(128),
});

export async function resetPasswordAction(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const raw = {
    email: String(formData.get("email") ?? ""),
    token: String(formData.get("token") ?? ""),
    password: String(formData.get("password") ?? ""),
  };
  const parsed = resetSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: "Invalid or expired link. Please request a new one." };
  }
  const { email, token, password } = parsed.data;
  const lower = email.toLowerCase();
  const hashed = createHash("sha256").update(token).digest("hex");
  const vt = await prisma.verificationToken.findFirst({
    where: { identifier: `reset:${lower}`, token: hashed, expires: { gt: new Date() } },
  });
  if (!vt) {
    return { error: "Invalid or expired link. Please request a new one." };
  }
  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.$transaction([
    prisma.user.update({ where: { email: lower }, data: { passwordHash } }),
    prisma.verificationToken.deleteMany({ where: { identifier: `reset:${lower}`, token: hashed } }),
  ]);
  return { redirectTo: "/login?reset=1" };
}
