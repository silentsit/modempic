import { prisma } from "@/lib/db";
import { deleteCouponAction, upsertCouponAction } from "@/lib/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default async function AdminCouponsPage() {
  const list = await prisma.coupon.findMany({ orderBy: { createdAt: "desc" } });
  return (
    <div>
      <h1 className="text-2xl font-bold">Coupons</h1>
      <div className="mt-4 space-y-4 text-sm">
        {list.map((c) => (
          <form key={c.id} action={upsertCouponAction} className="rounded-lg border border-[var(--border)] p-3">
            <input type="hidden" name="id" value={c.id} />
            <p className="mb-3 text-xs text-[var(--muted-foreground)]">
              Used {c.redemptionCount} / {c.maxRedemptions ?? "∞"}
            </p>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              <Input name="code" defaultValue={c.code} aria-label="Code" required />
              <Input name="description" defaultValue={c.description ?? ""} aria-label="Description" placeholder="Description" />
              <select name="type" className="rounded border px-2 py-1" defaultValue={c.type}>
                <option value="PERCENT">PERCENT</option>
                <option value="FIXED">FIXED</option>
              </select>
              <Input name="value" type="number" defaultValue={c.value} aria-label="Value" required />
              <Input name="minOrderCents" type="number" defaultValue={c.minOrderCents} aria-label="Minimum order cents" />
              <Input name="maxRedemptions" type="number" defaultValue={c.maxRedemptions ?? undefined} aria-label="Max redemptions" />
              <Input name="startsAt" type="datetime-local" defaultValue={c.startsAt?.toISOString().slice(0, 16)} aria-label="Starts at" />
              <Input name="endsAt" type="datetime-local" defaultValue={c.endsAt?.toISOString().slice(0, 16)} aria-label="Ends at" />
            </div>
            <label className="mt-3 flex items-center gap-2 text-sm">
              <input type="checkbox" name="active" defaultChecked={c.active} className="h-4 w-4" />
              Active
            </label>
            <div className="mt-3 flex gap-2">
              <Button type="submit" size="sm" variant="secondary">
                Save
              </Button>
              <Button formAction={deleteCouponAction} type="submit" size="sm" variant="destructive">
                Delete
              </Button>
            </div>
          </form>
        ))}
      </div>
      <h2 className="mt-8 text-lg font-semibold">Create</h2>
      <form action={upsertCouponAction} className="mt-2 max-w-md space-y-2">
        <div>
          <Label htmlFor="code">Code</Label>
          <Input id="code" name="code" required className="mt-1" />
        </div>
        <div>
          <Label htmlFor="type">Type</Label>
          <select id="type" name="type" className="mt-1 w-full rounded border px-2 py-1">
            <option value="PERCENT">PERCENT</option>
            <option value="FIXED">FIXED (cents)</option>
          </select>
        </div>
        <div>
          <Label htmlFor="value">Value</Label>
          <Input id="value" name="value" type="number" required className="mt-1" />
        </div>
        <div>
          <Label htmlFor="minOrderCents">Min order (cents)</Label>
          <Input id="minOrderCents" name="minOrderCents" type="number" defaultValue={0} className="mt-1" />
        </div>
        <div>
          <Label htmlFor="maxRedemptions">Max redemptions (optional)</Label>
          <Input id="maxRedemptions" name="maxRedemptions" type="number" className="mt-1" />
        </div>
        <div>
          <Label htmlFor="startsAt">Starts at (optional)</Label>
          <Input id="startsAt" name="startsAt" type="datetime-local" className="mt-1" />
        </div>
        <div>
          <Label htmlFor="endsAt">Ends at (optional)</Label>
          <Input id="endsAt" name="endsAt" type="datetime-local" className="mt-1" />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="active" defaultChecked className="h-4 w-4" />
          Active
        </label>
        <Button type="submit">Create coupon</Button>
      </form>
    </div>
  );
}
