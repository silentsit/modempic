import Link from "next/link";
import { prisma } from "@/lib/db";
import { Prisma, Role } from "@prisma/client";
import { requireStaff } from "@/lib/auth/admin";
import { userRowActionFlags } from "@/lib/admin/user-actions";
import { UserAdminNotice } from "./_components/user-admin-notice";
import { UsersTable, type UserTableRow } from "./_components/users-table";

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

  const rows: UserTableRow[] = users.map((u) => {
    const label = displayLabel(u);
    const orderCount = totalOrderCountByUser.get(u.id) ?? 0;
    const flags = userRowActionFlags({
      userId: u.id,
      userRole: u.role,
      userEmail: u.email,
      orderCount,
      currentUserId: session.user.id,
      currentUserRole,
    });
    return {
      id: u.id,
      label,
      email: u.email,
      role: u.role,
      liveOrderCount: liveOrderCountByUser.get(u.id) ?? 0,
      noofoxOrderCount: noofoxOrderCountByUser.get(u.id) ?? 0,
      joined: u.createdAt.toISOString().slice(0, 10),
      status: u.bannedAt ? "banned" : u.emailVerified ? "verified" : "none",
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

      <UsersTable rows={rows} />
      {users.length >= 500 ? (
        <p className="mt-3 text-xs text-[var(--muted-foreground)]">Showing the 500 most recently created users.</p>
      ) : null}
    </div>
  );
}
