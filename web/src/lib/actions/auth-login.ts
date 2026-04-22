"use server";

import { signIn } from "@/auth";
import { redirect } from "next/navigation";

export async function login(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const callbackUrl = String(formData.get("callbackUrl") ?? "/account");

  if (!email || !password) {
    return;
  }

  const result = await signIn("credentials", { email, password, redirect: false });
  if (result && typeof result === "object" && "error" in result && result.error) {
    redirect(`/login?error=CredentialsSignin&callbackUrl=${encodeURIComponent(callbackUrl)}`);
  }
  redirect(callbackUrl);
}

export async function loginWithGoogle(formData: FormData) {
  const callbackUrl = String(formData.get("callbackUrl") ?? "/account");
  await signIn("google", { redirectTo: callbackUrl });
}
