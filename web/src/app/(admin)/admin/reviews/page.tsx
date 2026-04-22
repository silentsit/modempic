import { prisma } from "@/lib/db";
import { setReviewStatusAction } from "@/lib/actions/admin";
import { ReviewStatus } from "@prisma/client";
import { Button } from "@/components/ui/button";

export default async function AdminReviewsPage() {
  const list = await prisma.review.findMany({ orderBy: { createdAt: "desc" }, take: 100, include: { product: true, user: { select: { email: true } } } });
  return (
    <div>
      <h1 className="text-2xl font-bold">Reviews</h1>
      <div className="mt-4 space-y-4 text-sm">
        {list.map((r) => (
          <div key={r.id} className="rounded-lg border p-3">
            <p className="font-medium">{r.product.name}</p>
            <p className="text-[var(--muted-foreground)]">{r.user.email}</p>
            <p className="mt-1">Rating: {r.rating}/5 — {r.status}</p>
            {r.title ? <p className="mt-1 font-medium">{r.title}</p> : null}
            <p className="mt-1 text-[var(--muted-foreground)]">{r.body}</p>
            <form action={setReviewStatusAction} className="mt-2 flex items-center gap-2">
              <input type="hidden" name="id" value={r.id} />
              <select name="status" className="rounded border bg-[var(--background)] px-2 py-1" defaultValue={r.status}>
                {Object.values(ReviewStatus).map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <Button type="submit" size="sm" variant="secondary">
                Set
              </Button>
            </form>
          </div>
        ))}
      </div>
    </div>
  );
}
