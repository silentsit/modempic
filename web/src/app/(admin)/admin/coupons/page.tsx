import { prisma } from "@/lib/db";
import { createCouponAction } from "@/lib/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default async function AdminCouponsPage() {
  const list = await prisma.coupon.findMany({ orderBy: { createdAt: "desc" } });
  return (
    <div>
      <h1 className="text-2xl font-bold">Coupons</h1>
      <ul className="mt-4 space-y-1 text-sm">
        {list.map((c) => (
          <li key={c.id}>
            <strong>{c.code}</strong> — {c.type} {c.value} {c.type === "PERCENT" ? "%" : "¢ min"} (min {c.minOrderCents}¢) · used{" "}
            {c.redemptionCount} / {c.maxRedemptions ?? "∞"} · {c.active ? "active" : "off"}
          </li>
        ))}
      </ul>
      <h2 className="mt-8 text-lg font-semibold">Create</h2>
      <form action={createCouponAction} className="mt-2 max-w-md space-y-2">
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
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="active" defaultChecked className="h-4 w-4" />
          Active
        </label>
        <Button type="submit">Create coupon</Button>
      </form>
    </div>
  );
}
