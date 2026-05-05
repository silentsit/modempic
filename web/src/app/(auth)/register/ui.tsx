"use client";

import { useActionState } from "react";
import { registerAction, type AuthFormState } from "@/lib/actions/auth";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function RegisterFormInner({ showGoogle }: { showGoogle: boolean }) {
  const sp = useSearchParams();
  const callbackUrl = sp.get("callbackUrl") ?? "/account";
  const [state, action, pending] = useActionState(registerAction, null as AuthFormState);

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
          <Label htmlFor="name">Full name</Label>
          <Input id="name" name="name" type="text" autoComplete="name" required className="mt-1.5" />
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" autoComplete="email" required className="mt-1.5" />
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <Input id="password" name="password" type="password" autoComplete="new-password" required minLength={8} className="mt-1.5" />
          <p className="mt-1 text-xs text-[var(--muted-foreground)]">At least 8 characters.</p>
        </div>
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Creating…" : "Create account"}
        </Button>
      </form>
      {showGoogle ? (
        <>
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[var(--border)]" />
            </div>
            <div className="relative flex justify-center text-xs uppercase text-[var(--muted-foreground)]">
              <span className="bg-[var(--background)] px-2">Or sign up with</span>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => signIn("google", { callbackUrl: callbackUrl || "/account" })}
          >
            Google
          </Button>
        </>
      ) : null}
    </>
  );
}

export function RegisterForm({ showGoogle }: { showGoogle: boolean }) {
  return (
    <Suspense fallback={<div className="mt-6 h-56 animate-pulse rounded-lg bg-[var(--muted)]" />}>
      <RegisterFormInner showGoogle={showGoogle} />
    </Suspense>
  );
}
