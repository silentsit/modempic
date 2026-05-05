"use client";

import { useActionState } from "react";
import { changePasswordAction, type ProfileState } from "@/lib/actions/profile";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";

export function PasswordForm() {
  const [state, action, pending] = useActionState(changePasswordAction, null as ProfileState);
  return (
    <form action={action} className="space-y-4">
      {state?.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
      {state?.success ? <p className="text-sm text-green-700">{state.success}</p> : null}
      <div>
        <Label htmlFor="currentPassword">Current password</Label>
        <PasswordInput id="currentPassword" name="currentPassword" required className="mt-1" autoComplete="current-password" />
      </div>
      <div>
        <Label htmlFor="newPassword">New password</Label>
        <PasswordInput id="newPassword" name="newPassword" required minLength={8} className="mt-1" autoComplete="new-password" />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Updating…" : "Update password"}
      </Button>
    </form>
  );
}
