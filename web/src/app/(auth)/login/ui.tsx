"use client";

import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useState, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import Link from "next/link";

type LoginFormProps = {
  socialProviders: { id: string; label: string }[];
  callbackUrl?: string;
  idPrefix?: string;
};

function LoginFormInner({ socialProviders, callbackUrl: callbackUrlProp, idPrefix = "login" }: LoginFormProps) {
  const sp = useSearchParams();
  const callbackUrl = callbackUrlProp ?? sp.get("callbackUrl") ?? "/account";
  const registered = sp.get("registered");
  const reset = sp.get("reset");
  const emailPrefill = sp.get("email") ?? undefined;
  const emailId = `${idPrefix}-email`;
  const passwordId = `${idPrefix}-password`;

  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email") ?? "");
    const password = String(fd.get("password") ?? "");
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl: callbackUrl || "/account",
    });
    setPending(false);
    if (res?.error) {
      setError("Invalid email or password.");
      return;
    }
    if (res?.url) {
      window.location.href = res.url;
      return;
    }
    window.location.href = callbackUrl || "/account";
  }

  return (
    <>
      {registered ? (
        <p className="mt-4 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-900 dark:border-green-900 dark:bg-green-950/40 dark:text-green-100">
          Account created. You can sign in now.
        </p>
      ) : null}
      {reset ? (
        <p className="mt-4 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-900 dark:border-green-900 dark:bg-green-950/40 dark:text-green-100">
          Password updated. Sign in with your new password.
        </p>
      ) : null}
      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div>
          <Label htmlFor={emailId}>Email</Label>
          <Input
            id={emailId}
            name="email"
            type="email"
            autoComplete="email"
            required
            defaultValue={emailPrefill ?? ""}
            className="mt-1.5"
          />
        </div>
        <div>
          <div className="flex items-center justify-between">
            <Label htmlFor={passwordId}>Password</Label>
            <Link href="/forgot-password" className="text-xs text-[var(--primary)] hover:underline">
              Forgot password?
            </Link>
          </div>
          <PasswordInput id={passwordId} name="password" autoComplete="current-password" required className="mt-1.5" />
        </div>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Signing in…" : "Sign in"}
        </Button>
      </form>
      {socialProviders.length > 0 ? (
        <>
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[var(--border)]" />
            </div>
            <div className="relative flex justify-center text-xs uppercase text-[var(--muted-foreground)]">
              <span className="bg-[var(--background)] px-2">Or continue with</span>
            </div>
          </div>
          <div className="space-y-3">
            {socialProviders.map((provider) => (
              <Button
                key={provider.id}
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => signIn(provider.id, { callbackUrl: callbackUrl || "/account" })}
              >
                Continue with {provider.label}
              </Button>
            ))}
          </div>
        </>
      ) : null}
    </>
  );
}

export function LoginForm(props: LoginFormProps) {
  return (
    <Suspense fallback={<div className="mt-6 h-48 animate-pulse rounded-lg bg-[var(--muted)]" />}>
      <LoginFormInner {...props} />
    </Suspense>
  );
}
