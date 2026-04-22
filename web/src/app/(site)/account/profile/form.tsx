"use client";

import { useActionState } from "react";
import { updateProfileAction, type ProfileState } from "@/lib/actions/profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ProfileForm({ defaultName, email }: { defaultName: string; email: string }) {
  const [state, action, pending] = useActionState(updateProfileAction, null as ProfileState);
  return (
    <form action={action} className="space-y-4">
      {state?.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
      {state?.success ? <p className="text-sm text-green-700">{state.success}</p> : null}
      <div>
        <Label htmlFor="name">Name</Label>
        <Input id="name" name="name" defaultValue={defaultName} required className="mt-1" />
      </div>
      <div>
        <Label>Email</Label>
        <Input value={email} readOnly className="mt-1 bg-[var(--muted)]" />
        <p className="mt-1 text-xs text-[var(--muted-foreground)]">Email changes are not supported in this build.</p>
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save"}
      </Button>
    </form>
  );
}
