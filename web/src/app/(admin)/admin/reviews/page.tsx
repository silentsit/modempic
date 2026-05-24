import Link from "next/link";
import { ReviewStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { setReviewStatusAction } from "@/lib/actions/admin";
import { Button } from "@/components/ui/button";

const filters: { label: string; value?: ReviewStatus }[] = [
  { label: "All" },
  { label: "Pending", value: ReviewStatus.PENDING },
  { label: "Approved", value: ReviewStatus.APPROVED },
  { label: "Rejected", value: ReviewStatus.REJECTED },
];

type Props = { searchParams?: Promise<{ status?: string }> };

export default async function AdminReviewsPage({ searchParams }: Props) {
  const sp = (await searchParams) ?? {};
  const raw = sp.status?.toUpperCase();
  const statusFilter =
    raw && Object.values(ReviewStatus).includes(raw as ReviewStatus) ? (raw as ReviewStatus) : undefined;

  const list = await prisma.review.findMany({
    where: statusFilter ? { status: statusFilter } : {},
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      product: { select: { name: true, slug: true } },
      user: { select: { email: true } },
    },
  });

  const counts = await prisma.review.groupBy({
    by: ["status"],
    _count: { id: true },
  });
  const pendingCount = counts.find((c) => c.status === ReviewStatus.PENDING)?._count.id ?? 0;

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Reviews</h1>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            Approve or reject customer reviews. Only approved reviews appear on product pages.
            {pendingCount > 0 ? (
              <span className="ml-1 font-medium text-amber-700 dark:text-amber-400">
                {pendingCount} pending moderation.
              </span>
            ) : null}
          </p>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {filters.map((f) => {
          const active = statusFilter === f.value || (!f.value && !statusFilter);
          const href = f.value ? `/admin/reviews?status=${f.value}` : "/admin/reviews";
          return (
            <Link
              key={f.label}
              href={href}
              className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                active
                  ? "border-[var(--primary)] bg-[var(--primary)] text-[var(--primary-foreground)]"
                  : "border-[var(--border)] bg-[var(--card)] hover:bg-[var(--muted)]"
              }`}
            >
              {f.label}
            </Link>
          );
        })}
      </div>

      <div className="mt-8 space-y-4 text-sm">
        {list.length === 0 ? (
          <p className="rounded-lg border border-dashed border-[var(--border)] p-8 text-center text-[var(--muted-foreground)]">
            No reviews in this filter.
          </p>
        ) : null}
        {list.map((r) => (
          <div key={r.id} className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-[var(--foreground)]">{r.product.name}</p>
                <p className="text-[var(--muted-foreground)]">{r.user.email}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href={`/product/${r.product.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-[var(--primary)] underline-offset-2 hover:underline"
                >
                  View product
                </Link>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    r.status === ReviewStatus.APPROVED
                      ? "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-100"
                      : r.status === ReviewStatus.REJECTED
                        ? "bg-red-100 text-red-900 dark:bg-red-950 dark:text-red-100"
                        : "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-100"
                  }`}
                >
                  {r.status}
                </span>
              </div>
            </div>
            <p className="mt-2 font-medium text-[var(--foreground)]">Rating: {r.rating}/5</p>
            {r.authorName ? (
              <p className="mt-1 text-sm text-[var(--muted-foreground)]">Display name: {r.authorName}</p>
            ) : null}
            {r.title ? <p className="mt-1 font-medium">{r.title}</p> : null}
            <p className="mt-1 text-[var(--muted-foreground)]">{r.body}</p>
            <form action={setReviewStatusAction} className="mt-4 flex flex-wrap items-center gap-2 border-t border-[var(--border)] pt-4">
              <input type="hidden" name="id" value={r.id} />
              <label className="sr-only" htmlFor={`status-${r.id}`}>
                Status
              </label>
              <select id={`status-${r.id}`} name="status" className="rounded-md border border-[var(--border)] bg-[var(--background)] px-2 py-2 text-sm" defaultValue={r.status}>
                {Object.values(ReviewStatus).map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <Button type="submit" size="sm" variant="secondary">
                Save status
              </Button>
            </form>
          </div>
        ))}
      </div>
    </div>
  );
}
