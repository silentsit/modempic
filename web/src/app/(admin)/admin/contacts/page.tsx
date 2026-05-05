import { prisma } from "@/lib/db";
import { setContactHandledAction } from "@/lib/actions/admin";
import { Button } from "@/components/ui/button";

type Props = { searchParams?: Promise<{ handled?: string }> };

export default async function AdminContactsPage({ searchParams }: Props) {
  const sp = (await searchParams) ?? {};
  const handled = sp.handled === "true" ? true : sp.handled === "false" ? false : undefined;
  const submissions = await prisma.contactSubmission.findMany({
    where: handled === undefined ? {} : { handled },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <div>
      <h1 className="text-2xl font-bold">Contact submissions</h1>
      <p className="mt-1 text-sm text-[var(--muted-foreground)]">Review storefront contact messages and mark them handled.</p>
      <div className="mt-4 flex flex-wrap gap-2 text-sm">
        <a href="/admin/contacts" className="rounded border border-[var(--border)] px-3 py-1 hover:bg-[var(--muted)]">
          All
        </a>
        <a href="/admin/contacts?handled=false" className="rounded border border-[var(--border)] px-3 py-1 hover:bg-[var(--muted)]">
          Open
        </a>
        <a href="/admin/contacts?handled=true" className="rounded border border-[var(--border)] px-3 py-1 hover:bg-[var(--muted)]">
          Handled
        </a>
      </div>
      <div className="mt-6 space-y-4">
        {submissions.length === 0 ? (
          <p className="rounded-lg border border-dashed border-[var(--border)] p-8 text-center text-sm text-[var(--muted-foreground)]">
            No contact submissions in this filter.
          </p>
        ) : null}
        {submissions.map((s) => (
          <div key={s.id} className="rounded-lg border border-[var(--border)] p-4 text-sm">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="font-semibold">{s.name}</p>
                <a href={`mailto:${s.email}`} className="text-[var(--primary)] hover:underline">
                  {s.email}
                </a>
                <p className="text-xs text-[var(--muted-foreground)]">{s.createdAt.toISOString()}</p>
              </div>
              <span className="rounded-full bg-[var(--muted)] px-2 py-1 text-xs">{s.handled ? "Handled" : "Open"}</span>
            </div>
            <p className="mt-3 whitespace-pre-wrap text-[var(--muted-foreground)]">{s.message}</p>
            <form action={setContactHandledAction} className="mt-4 flex items-center gap-2 border-t border-[var(--border)] pt-4">
              <input type="hidden" name="id" value={s.id} />
              <label className="flex items-center gap-2">
                <input type="checkbox" name="handled" defaultChecked={s.handled} className="h-4 w-4" />
                Handled
              </label>
              <Button type="submit" size="sm" variant="secondary">
                Save
              </Button>
            </form>
          </div>
        ))}
      </div>
    </div>
  );
}
