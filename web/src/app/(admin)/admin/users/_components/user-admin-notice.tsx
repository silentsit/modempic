const NOTICES: Record<string, { tone: "ok" | "warn" | "error"; message: string }> = {
  deleted: { tone: "ok", message: "User deleted." },
  reset_sent: { tone: "ok", message: "Password reset email sent." },
  set_password_sent: { tone: "ok", message: "Set-password email sent (user had no password on file)." },
  reset_failed: { tone: "warn", message: "Could not send email (no account for that address)." },
  no_email: { tone: "warn", message: "This user has no email address." },
  has_orders: { tone: "warn", message: "Users with orders cannot be deleted." },
  cannot_delete_self: { tone: "warn", message: "You cannot delete your own account." },
  forbidden: { tone: "error", message: "You do not have permission for that action." },
  error: { tone: "error", message: "Something went wrong. Try again." },
};

export function UserAdminNotice({ notice }: { notice?: string }) {
  if (!notice) return null;
  const meta = NOTICES[notice] ?? { tone: "error" as const, message: "Unknown notice." };
  const classes =
    meta.tone === "ok"
      ? "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-100"
      : meta.tone === "warn"
        ? "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100"
        : "border-red-200 bg-red-50 text-red-900 dark:border-red-900 dark:bg-red-950 dark:text-red-100";

  return (
    <p className={`rounded-md border px-3 py-2 text-sm ${classes}`} role="status">
      {meta.message}
    </p>
  );
}
