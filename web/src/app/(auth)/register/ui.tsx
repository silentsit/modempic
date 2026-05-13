"use client";

import { useEffect } from "react";
import { useActionState } from "react";
import { registerAction, type AuthFormState } from "@/lib/actions/auth";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";

type RegisterFormProps = {
  socialProviders: { id: string; label: string }[];
  callbackUrl?: string;
  idPrefix?: string;
};

function RegisterFormInner({ socialProviders, callbackUrl: callbackUrlProp, idPrefix = "register" }: RegisterFormProps) {
  const sp = useSearchParams();
  const router = useRouter();
  const callbackUrl = callbackUrlProp ?? sp.get("callbackUrl") ?? "/account";
  const [state, action, pending] = useActionState(registerAction, null as AuthFormState);
  const nameId = `${idPrefix}-name`;
  const emailId = `${idPrefix}-email`;
  const passwordId = `${idPrefix}-password`;

  useEffect(() => {
    const r = state?.redirectTo;
    if (!r) return;
    if (/^https?:\/\//i.test(r)) {
      window.location.assign(r);
    } else {
      router.push(r);
    }
  }, [state?.redirectTo, router]);

  return (
    <>
      {state?.error ? (
        <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900 dark:border-red-900 dark:bg-red-950/40">
          {state.error}
        </p>
      ) : null}
      <form action={action} className="mt-6 space-y-4">
        <input type="hidden" name="callbackUrl" value={callbackUrl} />
        <div>
          <Label htmlFor={nameId}>Full name</Label>
          <Input id={nameId} name="name" type="text" autoComplete="name" required className="mt-1.5" />
        </div>
        <div>
          <Label htmlFor={emailId}>Email</Label>
          <Input id={emailId} name="email" type="email" autoComplete="email" required className="mt-1.5" />
        </div>
        <div>
          <Label htmlFor={passwordId}>Password</Label>
          <PasswordInput id={passwordId} name="password" autoComplete="new-password" required minLength={8} className="mt-1.5" />
          <p className="mt-1 text-xs text-[var(--muted-foreground)]">At least 8 characters.</p>
        </div>
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Creating…" : "Create account"}
        </Button>
      </form>
      {socialProviders.length > 0 ? (
        <>
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[var(--border)]" />
            </div>
            <div className="relative flex justify-center text-xs uppercase text-[var(--muted-foreground)]">
              <span className="bg-[var(--background)] px-2">Or sign up with</span>
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

export function RegisterForm(props: RegisterFormProps) {
  return (
    <Suspense fallback={<div className="mt-6 h-56 animate-pulse rounded-lg bg-[var(--muted)]" />}>
      <RegisterFormInner {...props} />
    </Suspense>
  );
}
