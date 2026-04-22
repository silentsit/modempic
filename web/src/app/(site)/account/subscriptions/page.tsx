import type { Metadata } from "next";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export const metadata: Metadata = { title: "Subscriptions" };

export default async function SubscriptionsPage() {
  const session = await auth();
  const subs = await prisma.subscription.findMany({
    where: { userId: session!.user.id },
    include: { plan: true },
  });

  return (
    <div>
      <h2 className="text-xl font-semibold">Subscriptions</h2>
      <p className="mt-1 text-sm text-[var(--muted-foreground)]">
        Subscribe-and-save and recurring plans are not enabled yet. This page is here so you can add them without
        changing routing.
      </p>
      {subs.length === 0 ? (
        <p className="mt-4 text-sm text-[var(--muted-foreground)]">You have no active subscriptions.</p>
      ) : (
        <ul className="mt-4 space-y-2">
          {subs.map((s) => (
            <li key={s.id} className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm">
              {s.plan.name} — {s.status} · ${(s.plan.priceCents / 100).toFixed(2)} / {s.plan.interval}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
