"use client";

import { useTransition } from "react";
import { sendUserPasswordResetAction } from "@/lib/actions/admin-users";
import { Button } from "@/components/ui/button";

export function UserPasswordResetButton({
  userId,
  email,
  canReset,
  blockedReason,
}: {
  userId: string;
  email: string;
  canReset: boolean;
  blockedReason?: string;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={!canReset || pending}
      title={blockedReason}
      onClick={() => {
        if (!canReset) return;
        if (!confirm(`Send a password reset email to ${email}?`)) return;
        const fd = new FormData();
        fd.set("id", userId);
        startTransition(async () => {
          await sendUserPasswordResetAction(fd);
        });
      }}
    >
      {pending ? "Sending…" : "Send password reset"}
    </Button>
  );
}
