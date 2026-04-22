"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { signIn } from "@/auth";

export async function registerUser(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").toLowerCase().trim();
  const password = String(formData.get("password") ?? "");
  if (!name || !email || !password || password.length < 8) {
    redirect("/register?error=invalid");
  }
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    redirect("/register?error=exists");
  }
  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.create({
    data: { name, email, passwordHash, emailVerified: new Date() },
  });
  const result = await signIn("credentials", { email, password, redirect: false });
  if (result && typeof result === "object" && "error" in result && result.error) {
    redirect("/login?error=register");
  }
  redirect("/account");
}
