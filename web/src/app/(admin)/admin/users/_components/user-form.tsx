"use client";

import { useActionState } from "react";
import { Role } from "@prisma/client";
import { updateUserAction, type AdminUserFormState } from "@/lib/actions/admin-users";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type UserForForm = {
  id: string;
  name: string | null;
  email: string | null;
  role: Role;
  bannedAt: Date | null;
};

export function UserForm({
  user,
  canChangeRole,
  canChangeEmail,
}: {
  user: UserForForm;
  canChangeRole: boolean;
  canChangeEmail: boolean;
}) {
  const [state, action, pending] = useActionState(updateUserAction, null as AdminUserFormState);

  return (
    <form action={action} className="mt-6 max-w-xl space-y-4 rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
      <h2 className="text-lg font-semibold">Edit user</h2>
      {state?.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
      {state?.success ? <p className="text-sm text-green-700">{state.success}</p> : null}
      <input type="hidden" name="id" value={user.id} />
      <div>
        <Label htmlFor="name">Name</Label>
        <Input id="name" name="name" defaultValue={user.name ?? ""} className="mt-1" />
      </div>
      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          defaultValue={user.email ?? ""}
          readOnly={!canChangeEmail}
          required
          className={`mt-1 ${!canChangeEmail ? "bg-[var(--muted)]" : ""}`}
        />
        {!canChangeEmail ? (
          <p className="mt-1 text-xs text-[var(--muted-foreground)]">This account has no email on file.</p>
        ) : null}
      </div>
      <div>
        <Label htmlFor="role">Role</Label>
        <select
          id="role"
          name="role"
          defaultValue={user.role}
          disabled={!canChangeRole}
          className="mt-1 w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm disabled:bg-[var(--muted)]"
        >
          {Object.values(Role).map((r) => (
            <option key={r} value={r}>
              {r.charAt(0) + r.slice(1).toLowerCase()}
            </option>
          ))}
        </select>
        {!canChangeRole ? (
          <p className="mt-1 text-xs text-[var(--muted-foreground)]">Only administrators can change staff or admin roles.</p>
        ) : null}
      </div>
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="banned"
          name="banned"
          value="1"
          defaultChecked={Boolean(user.bannedAt)}
          className="h-4 w-4 rounded border-[var(--border)]"
        />
        <Label htmlFor="banned" className="font-normal">
          Banned (cannot sign in)
        </Label>
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Update user"}
      </Button>
    </form>
  );
}
