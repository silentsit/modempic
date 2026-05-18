"use client";

import Link from "next/link";
import { useTransition } from "react";
import { deleteUserAction, sendUserPasswordResetAction } from "@/lib/actions/admin-users";

export type UserTableRow = {
  id: string;
  label: string;
  email: string | null;
  role: string;
  liveOrderCount: number;
  noofoxOrderCount: number;
  joined: string;
  status: "banned" | "verified" | "none";
  canDelete: boolean;
  deleteBlockedReason?: string;
  canResetPassword: boolean;
  resetBlockedReason?: string;
};

function Sep() {
  return <span className="text-[var(--muted-foreground)]" aria-hidden>|</span>;
}

function RowActions({
  row,
  pending,
  onDelete,
  onReset,
}: {
  row: UserTableRow;
  pending: boolean;
  onDelete: (row: UserTableRow) => void;
  onReset: (row: UserTableRow) => void;
}) {
  return (
    <div
      className="row-actions mt-0.5 flex flex-wrap items-center gap-x-1 text-xs leading-relaxed opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
      onClick={(e) => e.stopPropagation()}
    >
      <Link href={`/admin/users/${row.id}?edit=1`} className="text-[#2271b1] hover:underline">
        Edit
      </Link>
      <Sep />
      {row.canDelete ? (
        <button
          type="button"
          onClick={() => onDelete(row)}
          disabled={pending}
          className="text-[#b32d2e] hover:underline disabled:opacity-50"
        >
          Delete
        </button>
      ) : (
        <span className="cursor-not-allowed text-[var(--muted-foreground)]" title={row.deleteBlockedReason}>
          Delete
        </span>
      )}
      <Sep />
      <Link href={`/admin/users/${row.id}`} className="text-[#2271b1] hover:underline">
        View
      </Link>
      <Sep />
      {row.canResetPassword ? (
        <button
          type="button"
          onClick={() => onReset(row)}
          disabled={pending}
          className="text-[#2271b1] hover:underline disabled:opacity-50"
        >
          Send password reset
        </button>
      ) : (
        <span className="cursor-not-allowed text-[var(--muted-foreground)]" title={row.resetBlockedReason}>
          Send password reset
        </span>
      )}
    </div>
  );
}

export function UsersTable({ rows }: { rows: UserTableRow[] }) {
  const [pending, startTransition] = useTransition();

  function onDelete(row: UserTableRow) {
    if (!row.canDelete || pending) return;
    if (!confirm(`Delete user "${row.label}"? This cannot be undone.`)) return;
    const fd = new FormData();
    fd.set("id", row.id);
    startTransition(() => {
      void deleteUserAction(fd);
    });
  }

  function onReset(row: UserTableRow) {
    if (!row.canResetPassword || pending) return;
    if (!confirm(`Send a password reset email to "${row.label}"?`)) return;
    const fd = new FormData();
    fd.set("id", row.id);
    startTransition(() => {
      void sendUserPasswordResetAction(fd);
    });
  }

  return (
    <div className="mt-6 overflow-x-auto rounded-lg border border-[var(--border)]">
      <table className="w-full min-w-[760px] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-[var(--border)] bg-[var(--muted)]">
            <th className="px-3 py-2 font-semibold">User</th>
            <th className="px-3 py-2 font-semibold">Email</th>
            <th className="px-3 py-2 font-semibold">Role</th>
            <th className="px-3 py-2 font-semibold">Live Orders</th>
            <th className="px-3 py-2 font-semibold">Noofox Past</th>
            <th className="px-3 py-2 font-semibold">Joined</th>
            <th className="px-3 py-2 font-semibold">Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={7} className="px-3 py-8 text-center text-[var(--muted-foreground)]">
                No users match this filter.
              </td>
            </tr>
          ) : (
            rows.map((u) => (
              <tr key={u.id} className="group border-b border-[var(--border)] last:border-0">
                <td className="px-3 py-2 align-top">
                  <Link href={`/admin/users/${u.id}`} className="font-medium text-[#2271b1] hover:underline">
                    {u.label}
                  </Link>
                  <RowActions row={u} pending={pending} onDelete={onDelete} onReset={onReset} />
                </td>
                <td className="px-3 py-2 align-top">
                  {u.email ? (
                    <a href={`mailto:${u.email}`} className="text-[var(--primary)] hover:underline">
                      {u.email}
                    </a>
                  ) : (
                    <span className="text-[var(--muted-foreground)]">—</span>
                  )}
                </td>
                <td className="px-3 py-2 align-top capitalize">{u.role.toLowerCase()}</td>
                <td className="px-3 py-2 align-top tabular-nums">{u.liveOrderCount}</td>
                <td className="px-3 py-2 align-top tabular-nums">{u.noofoxOrderCount}</td>
                <td className="px-3 py-2 align-top whitespace-nowrap text-[var(--muted-foreground)]">{u.joined}</td>
                <td className="px-3 py-2 align-top">
                  {u.status === "banned" ? (
                    <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800 dark:bg-red-950 dark:text-red-200">
                      Banned
                    </span>
                  ) : u.status === "verified" ? (
                    <span className="text-[var(--muted-foreground)]">Verified</span>
                  ) : (
                    <span className="text-[var(--muted-foreground)]">—</span>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
