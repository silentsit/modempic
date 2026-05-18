import Link from "next/link";
import { notFound } from "next/navigation";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/auth/admin";
import { userRowActionFlags } from "@/lib/admin/user-actions";
import { UserAdminNotice } from "../_components/user-admin-notice";
import { UserForm } from "../_components/user-form";
import { UserDeleteForm } from "../_components/user-delete-form";
import { UserPasswordResetButton } from "../_components/user-password-reset-button";
import { UserRowActions } from "../_components/user-row-actions";

const NOOFOX_ORDER_PREFIX = "NF-";

type Props = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ edit?: string; notice?: string }>;
};

function displayLabel(user: { name: string | null; email: string | null }) {
  return user.name?.trim() || user.email || "User";
}

export default async function AdminUserDetailPage({ params, searchParams }: Props) {
  const session = await requireStaff();
  const { id } = await params;
  const sp = (await searchParams) ?? {};
  const showEdit = sp.edit === "1";
  const notice = sp.notice;

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      emailVerified: true,
      bannedAt: true,
      createdAt: true,
      updatedAt: true,
      passwordHash: true,
      _count: { select: { orders: true, reviews: true } },
    },
  });
  if (!user) notFound();

  const [liveOrderCount, noofoxOrderCount, recentOrders] = await Promise.all([
    prisma.order.count({
      where: { userId: id, orderNumber: { not: { startsWith: NOOFOX_ORDER_PREFIX } } },
    }),
    prisma.order.count({
      where: { userId: id, orderNumber: { startsWith: NOOFOX_ORDER_PREFIX } },
    }),
    prisma.order.findMany({
      where: { userId: id },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { id: true, orderNumber: true, status: true, totalCents: true, createdAt: true },
    }),
  ]);

  const label = displayLabel(user);
  const hasPassword = Boolean(user.passwordHash);
  const orderCount = user._count.orders;
  const currentRole = session.user.role as Role;
  const flags = userRowActionFlags({
    userId: user.id,
    userRole: user.role,
    userEmail: user.email,
    hasPassword,
    orderCount,
    currentUserId: session.user.id,
    currentUserRole: currentRole,
  });

  const canChangeRole = currentRole === Role.ADMIN;
  const canChangeEmail = Boolean(user.email);

  return (
    <div className="space-y-4">
      <UserAdminNotice notice={notice} />

      <div className="flex flex-wrap items-center gap-2 text-sm text-[var(--muted-foreground)]">
        <Link href="/admin/users" className="text-[#2271b1] hover:underline">
          Users
        </Link>
        <span aria-hidden>/</span>
        <span className="text-[var(--foreground)]">{label}</span>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{label}</h1>
          <UserRowActions
            userId={user.id}
            displayLabel={label}
            canDelete={flags.canDelete}
            deleteBlockedReason={flags.deleteBlockedReason}
            canResetPassword={flags.canResetPassword}
            resetBlockedReason={flags.resetBlockedReason}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {!showEdit ? (
            <Link
              href={`/admin/users/${id}?edit=1`}
              className="inline-flex h-9 items-center rounded-md border border-[var(--border)] px-3 text-sm hover:bg-[var(--muted)]"
            >
              Edit
            </Link>
          ) : null}
          {user.email ? (
            <UserPasswordResetButton
              userId={user.id}
              email={user.email}
              canReset={flags.canResetPassword}
              blockedReason={flags.resetBlockedReason}
            />
          ) : null}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 text-sm">
          <h2 className="font-semibold">Profile</h2>
          <dl className="mt-3 space-y-2">
            <div className="flex justify-between gap-4">
              <dt className="text-[var(--muted-foreground)]">Email</dt>
              <dd>
                {user.email ? (
                  <a href={`mailto:${user.email}`} className="text-[#2271b1] hover:underline">
                    {user.email}
                  </a>
                ) : (
                  "—"
                )}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-[var(--muted-foreground)]">Role</dt>
              <dd className="capitalize">{user.role.toLowerCase()}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-[var(--muted-foreground)]">Status</dt>
              <dd>
                {user.bannedAt ? (
                  <span className="text-red-700 dark:text-red-300">Banned</span>
                ) : user.emailVerified ? (
                  "Email verified"
                ) : (
                  "—"
                )}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-[var(--muted-foreground)]">Joined</dt>
              <dd>{user.createdAt.toISOString().slice(0, 10)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-[var(--muted-foreground)]">Login</dt>
              <dd>{hasPassword ? "Email & password" : "No password (OAuth / invite)"}</dd>
            </div>
          </dl>
        </section>

        <section className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 text-sm">
          <h2 className="font-semibold">Activity</h2>
          <dl className="mt-3 space-y-2">
            <div className="flex justify-between gap-4">
              <dt className="text-[var(--muted-foreground)]">Live orders</dt>
              <dd className="tabular-nums">{liveOrderCount}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-[var(--muted-foreground)]">Noofox past orders</dt>
              <dd className="tabular-nums">{noofoxOrderCount}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-[var(--muted-foreground)]">Reviews</dt>
              <dd className="tabular-nums">{user._count.reviews}</dd>
            </div>
          </dl>
        </section>
      </div>

      {recentOrders.length > 0 ? (
        <section className="rounded-lg border border-[var(--border)] overflow-x-auto">
          <h2 className="border-b border-[var(--border)] bg-[var(--muted)] px-3 py-2 text-sm font-semibold">
            Recent orders
          </h2>
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--border)]">
                <th className="px-3 py-2 font-semibold">Order</th>
                <th className="px-3 py-2 font-semibold">Status</th>
                <th className="px-3 py-2 font-semibold">Total</th>
                <th className="px-3 py-2 font-semibold">Date</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((o) => (
                <tr key={o.id} className="border-b border-[var(--border)] last:border-0">
                  <td className="px-3 py-2">
                    <Link href={`/admin/orders/${o.id}`} className="text-[#2271b1] hover:underline">
                      {o.orderNumber}
                    </Link>
                  </td>
                  <td className="px-3 py-2">{o.status}</td>
                  <td className="px-3 py-2 tabular-nums">${(o.totalCents / 100).toFixed(2)}</td>
                  <td className="px-3 py-2 text-[var(--muted-foreground)]">
                    {o.createdAt.toISOString().slice(0, 10)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ) : null}

      {showEdit ? (
        <UserForm user={user} canChangeRole={canChangeRole} canChangeEmail={canChangeEmail} />
      ) : null}

      <UserDeleteForm
        userId={user.id}
        displayLabel={label}
        canDelete={flags.canDelete}
        blockedReason={flags.deleteBlockedReason}
      />
    </div>
  );
}
