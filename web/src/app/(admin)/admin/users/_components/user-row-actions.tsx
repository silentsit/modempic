"use client";

import Link from "next/link";
import { useTransition } from "react";
import { deleteUserAction, sendUserPasswordResetAction } from "@/lib/actions/admin-users";

type Props = {
  userId: string;
  displayLabel: string;
  canDelete: boolean;
  deleteBlockedReason?: string;
  canResetPassword: boolean;
  resetBlockedReason?: string;
};

function Sep() {
  return <span className="text-[var(--muted-foreground)]" aria-hidden>|</span>;
}

export function UserRowActions({
  userId,
  displayLabel,
  canDelete,
  deleteBlockedReason,
  canResetPassword,
  resetBlockedReason,
}: Props) {
  const [pending, startTransition] = useTransition();

  function onDelete() {
    if (!canDelete || pending) return;
    if (!confirm(`Delete user “${displayLabel}”? This cannot be undone.`)) return;
    const fd = new FormData();
    fd.set("id", userId);
    startTransition(async () => {
      await deleteUserAction(fd);
    });
  }

  function onReset() {
    if (!canResetPassword || pending) return;
    if (!confirm(`Send a password reset email to “${displayLabel}”?`)) return;
    const fd = new FormData();
    fd.set("id", userId);
    startTransition(async () => {
      await sendUserPasswordResetAction(fd);
    });
  }

  return (
    <div
      className="row-actions mt-0.5 flex flex-wrap items-center gap-x-1 text-xs leading-relaxed opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
      onClick={(e) => e.stopPropagation()}
    >
      <Link href={`/admin/users/${userId}?edit=1`} className="text-[#2271b1] hover:underline">
        Edit
      </Link>
      <Sep />
      {canDelete ? (
        <button
          type="button"
          onClick={onDelete}
          disabled={pending}
          className="text-[#b32d2e] hover:underline disabled:opacity-50"
        >
          Delete
        </button>
      ) : (
        <span className="cursor-not-allowed text-[var(--muted-foreground)]" title={deleteBlockedReason}>
          Delete
        </span>
      )}
      <Sep />
      <Link href={`/admin/users/${userId}`} className="text-[#2271b1] hover:underline">
        View
      </Link>
      <Sep />
      {canResetPassword ? (
        <button
          type="button"
          onClick={onReset}
          disabled={pending}
          className="text-[#2271b1] hover:underline disabled:opacity-50"
        >
          Send password reset
        </button>
      ) : (
        <span className="cursor-not-allowed text-[var(--muted-foreground)]" title={resetBlockedReason}>
          Send password reset
        </span>
      )}
    </div>
  );
}
