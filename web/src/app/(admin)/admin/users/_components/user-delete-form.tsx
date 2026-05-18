"use client";

import { useTransition } from "react";
import { deleteUserAction } from "@/lib/actions/admin-users";
import { Button } from "@/components/ui/button";

export function UserDeleteForm({
  userId,
  displayLabel,
  canDelete,
  blockedReason,
}: {
  userId: string;
  displayLabel: string;
  canDelete: boolean;
  blockedReason?: string;
}) {
  const [pending, startTransition] = useTransition();

  if (!canDelete) {
    return (
      <div className="mt-8 max-w-xl rounded-lg border border-[var(--border)] p-4">
        <h2 className="font-medium text-[var(--foreground)]">Delete user</h2>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">{blockedReason ?? "This user cannot be deleted."}</p>
      </div>
    );
  }

  return (
    <div className="mt-8 max-w-xl rounded-lg border border-red-200 p-4 dark:border-red-900">
      <h2 className="font-medium text-red-700 dark:text-red-300">Delete user</h2>
      <p className="mt-1 text-sm text-[var(--muted-foreground)]">
        Permanently removes <strong>{displayLabel}</strong>. Only available when the user has no orders.
      </p>
      <Button
        type="button"
        size="sm"
        variant="destructive"
        className="mt-3"
        disabled={pending}
        onClick={() => {
          if (!confirm(`Delete user “${displayLabel}”? This cannot be undone.`)) return;
          const fd = new FormData();
          fd.set("id", userId);
          startTransition(async () => {
            await deleteUserAction(fd);
          });
        }}
      >
        {pending ? "Deleting…" : "Delete user"}
      </Button>
    </div>
  );
}
