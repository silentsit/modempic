"use client";

import { useEffect } from "react";
import { useActionState } from "react";
import { use } from "react";
import { useRouter } from "next/navigation";
import { resetPasswordAction, type AuthFormState } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";

export function ResetForm({ searchParams }: { searchParams: Promise<{ token?: string; email?: string }> }) {
  const { token, email } = use(searchParams);
  const router = useRouter();
  const [state, action, pending] = useActionState(resetPasswordAction, null as AuthFormState);

  useEffect(() => {
    const r = state?.redirectTo;
    if (!r) return;
    if (/^https?:\/\//i.test(r)) {
      window.location.assign(r);
    } else {
      router.push(r);
    }
  }, [state?.redirectTo, router]);

  if (!token || !email) {
    return (
      <p className="mt-6 text-sm text-red-600">
        Invalid link.{" "}
        <a href="/forgot-password" className="underline">
          Request a new reset
        </a>
        .
      </p>
    );
  }

  return (
    <form action={action} className="mt-6 space-y-4">
      <input type="hidden" name="token" value={token} />
      <input type="hidden" name="email" value={email} />
      {state?.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
      <div>
        <Label htmlFor="password">New password</Label>
        <PasswordInput id="password" name="password" autoComplete="new-password" required minLength={8} className="mt-1.5" />
      </div>
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Saving…" : "Update password"}
      </Button>
    </form>
  );
}
