import Link from "next/link";
import { prisma } from "@/lib/db";
import { Prisma, Role } from "@prisma/client";
import { requireStaff } from "@/lib/auth/admin";
import { userRowActionFlags } from "@/lib/admin/user-actions";
import { UserRowActions } from "./_components/user-row-actions";
import { UserAdminNotice } from "./_components/user-admin-notice";

type Props = { searchParams?: Promise<{ role?: string; notice?: string }> };

const ROLE_TABS: { label: string; role?: Role }[] = [
  { label: "All" },
  { label: "Customers", role: Role.CUSTOMER },
  { label: "Staff", role: Role.STAFF },
  { label: "Admins", role: Role.ADMIN },
];

const NOOFOX_ORDER_PREFIX = "NF-";

function parseRoleParam(v: string | undefined): Role | undefined {
  const x = (v ?? "").toUpperCase();
  if (x === "CUSTOMER" || x === "STAFF" || x === "ADMIN") return x as Role;
  return undefined;
}

function roleWhere(roleFilter: Role | undefined): Prisma.UserWhereInput {
  return roleFilter ? { role: roleFilter } : {};
}

function displayLabel(user: { name: string | null; email: string | null }) {
  return user.name?.trim() || user.email || "—";
}

export default async function AdminUsersPage({ searchParams }: Props) {
  const session = await requireStaff();
  const sp = (await searchParams) ?? {};
  const roleFilter = parseRoleParam(sp.role);
  const notice = sp.notice;

  const users = await prisma.user.findMany({
    where: roleWhere(roleFilter),
    orderBy: { createdAt: "desc" },
    take: 500,
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      emailVerified: true,
      bannedAt: true,
      createdAt: true,
      passwordHash: true,
    },
  });

  const ids = users.map((u) => u.id);
  const [liveOrderGroups, noofoxOrderGroups, totalOrderGroups] =
    ids.length === 0
      ? [[], [], []]
      : await Promise.all([
          prisma.order.groupBy({
            by: ["userId"],
            where: { userId: { in: ids }, orderNumber: { not: { startsWith: NOOFOX_ORDER_PREFIX } } },
            _count: { _all: true },
          }),
          prisma.order.groupBy({
            by: ["userId"],
            where: { userId: { in: ids }, orderNumber: { startsWith: NOOFOX_ORDER_PREFIX } },
            _count: { _all: true },
          }),
          prisma.order.groupBy({
            by: ["userId"],
            where: { userId: { in: ids } },
            _count: { _all: true },
          }),
        ]);
  const liveOrderCountByUser = new Map(liveOrderGroups.map((g) => [g.userId, g._count._all]));
  const noofoxOrderCountByUser = new Map(noofoxOrderGroups.map((g) => [g.userId, g._count._all]));
  const totalOrderCountByUser = new Map(totalOrderGroups.map((g) => [g.userId, g._count._all]));

  const currentUserRole = session.user.role as Role;

  const rows = users.map((u) => {
    const label = displayLabel(u);
    const orderCount = totalOrderCountByUser.get(u.id) ?? 0;
    const flags = userRowActionFlags({
      userId: u.id,
      userRole: u.role,
      userEmail: u.email,
      hasPassword: Boolean(u.passwordHash),
      orderCount,
      currentUserId: session.user.id,
      currentUserRole,
    });
    return {
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      emailVerified: u.emailVerified,
      bannedAt: u.bannedAt,
      createdAt: u.createdAt,
      label,
      liveOrderCount: liveOrderCountByUser.get(u.id) ?? 0,
      noofoxOrderCount: noofoxOrderCountByUser.get(u.id) ?? 0,
      ...flags,
    };
  });

  return (
    <div>
      <h1 className="text-2xl font-bold">Users</h1>
      <p className="mt-1 text-sm text-[var(--muted-foreground)]">
        <strong className="text-[var(--foreground)]">Live Orders</strong> counts native Modempic orders.{" "}
        <strong className="text-[var(--foreground)]">Noofox Past</strong> counts imported Woo orders with the{" "}
        <code className="text-xs">NF-</code> prefix.
      </p>
      <p className="mt-1 text-sm text-[var(--muted-foreground)]">
        Storefront contact messages:{" "}
        <Link href="/admin/contacts" className="text-[var(--primary)] hover:underline">
          Contacts
        </Link>
        .
      </p>

      {notice ? (
        <div className="mt-4">
          <UserAdminNotice notice={notice} />
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
        <span className="mr-1 text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Role</span>
        {ROLE_TABS.map(({ label, role }) => {
          const href = role ? `/admin/users?role=${role.toLowerCase()}` : "/admin/users";
          const active = roleFilter === role || (!roleFilter && !role);
          return (
            <Link
              key={label}
              href={href}
              className={`rounded border px-3 py-1 transition-colors ${
                active
                  ? "border-[var(--primary)] bg-[var(--primary)] text-[var(--primary-foreground)]"
                  : "border-[var(--border)] hover:bg-[var(--muted)]"
              }`}
            >
              {label}
            </Link>
          );
        })}
      </div>

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
                    <UserRowActions
                      userId={u.id}
                      displayLabel={u.label}
                      canDelete={u.canDelete}
                      deleteBlockedReason={u.deleteBlockedReason}
                      canResetPassword={u.canResetPassword}
                      resetBlockedReason={u.resetBlockedReason}
                    />
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
                  <td className="px-3 py-2 align-top whitespace-nowrap text-[var(--muted-foreground)]">
                    {u.createdAt.toISOString().slice(0, 10)}
                  </td>
                  <td className="px-3 py-2 align-top">
                    {u.bannedAt ? (
                      <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800 dark:bg-red-950 dark:text-red-200">
                        Banned
                      </span>
                    ) : u.emailVerified ? (
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
      {users.length >= 500 ? (
        <p className="mt-3 text-xs text-[var(--muted-foreground)]">Showing the 500 most recently created users.</p>
      ) : null}
    </div>
  );
}
