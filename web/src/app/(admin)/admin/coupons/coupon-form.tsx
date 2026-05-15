"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { upsertCouponAction } from "@/lib/actions/admin";

export type CouponFormProduct = { id: string; name: string; slug: string };

export type SerializedCoupon = {
  id: string;
  code: string;
  description: string | null;
  type: "PERCENT" | "FIXED";
  value: number;
  minOrderCents: number;
  maxOrderCents: number | null;
  maxRedemptions: number | null;
  usageLimitPerUser: number | null;
  startsAtIso: string | null;
  endsAtIso: string | null;
  active: boolean;
  freeShipping: boolean;
  excludeSaleItems: boolean;
  allowedEmails: string | null;
  includeProducts: CouponFormProduct[];
  excludeProducts: CouponFormProduct[];
  includeCategoryIds: string[];
  excludeCategoryIds: string[];
};

type CategoryOpt = { id: string; name: string; slug: string };

type TabId = "general" | "restrictions" | "limits";

function randomCouponCode(len = 8): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < len; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

function toDatetimeLocal(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 16);
}

export function CouponForm({
  coupon,
  categories,
}: {
  coupon: SerializedCoupon | null;
  categories: CategoryOpt[];
}) {
  const router = useRouter();
  const isEdit = Boolean(coupon);
  const [tab, setTab] = useState<TabId>("general");

  const [code, setCode] = useState(coupon?.code ?? "");
  const [description, setDescription] = useState(coupon?.description ?? "");
  const [type, setType] = useState<"PERCENT" | "FIXED">(coupon?.type ?? "PERCENT");
  const [percentVal, setPercentVal] = useState(
    coupon?.type === "PERCENT" ? String(coupon.value) : "10",
  );
  const [fixedDollars, setFixedDollars] = useState(
    coupon?.type === "FIXED" ? (coupon.value / 100).toFixed(2) : "5.00",
  );
  const [minSpendDollars, setMinSpendDollars] = useState(
    ((coupon?.minOrderCents ?? 0) / 100).toFixed(2),
  );
  const [maxSpendDollars, setMaxSpendDollars] = useState(
    coupon?.maxOrderCents != null ? (coupon.maxOrderCents / 100).toFixed(2) : "",
  );
  const [startsLocal, setStartsLocal] = useState(toDatetimeLocal(coupon?.startsAtIso ?? null));
  const [endsLocal, setEndsLocal] = useState(toDatetimeLocal(coupon?.endsAtIso ?? null));
  const [active, setActive] = useState(coupon?.active ?? true);
  const [freeShipping, setFreeShipping] = useState(coupon?.freeShipping ?? false);
  const [excludeSaleItems, setExcludeSaleItems] = useState(coupon?.excludeSaleItems ?? false);
  const [allowedEmails, setAllowedEmails] = useState(coupon?.allowedEmails ?? "");
  const [maxRedemptions, setMaxRedemptions] = useState(
    coupon?.maxRedemptions != null ? String(coupon.maxRedemptions) : "",
  );
  const [usageLimitPerUser, setUsageLimitPerUser] = useState(
    coupon?.usageLimitPerUser != null ? String(coupon.usageLimitPerUser) : "",
  );

  const [includeProducts, setIncludeProducts] = useState<CouponFormProduct[]>(coupon?.includeProducts ?? []);
  const [excludeProducts, setExcludeProducts] = useState<CouponFormProduct[]>(coupon?.excludeProducts ?? []);
  const [includeCategoryIds, setIncludeCategoryIds] = useState<Set<string>>(
    () => new Set(coupon?.includeCategoryIds ?? []),
  );
  const [excludeCategoryIds, setExcludeCategoryIds] = useState<Set<string>>(
    () => new Set(coupon?.excludeCategoryIds ?? []),
  );

  const [includeSearch, setIncludeSearch] = useState("");
  const [excludeSearch, setExcludeSearch] = useState("");
  const [includeHits, setIncludeHits] = useState<CouponFormProduct[]>([]);
  const [excludeHits, setExcludeHits] = useState<CouponFormProduct[]>([]);
  const includeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const excludeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [state, act, pending] = useActionState(upsertCouponAction, null);

  useEffect(() => {
    if (state?.success && state.id && !isEdit) {
      router.replace(`/admin/coupons/${state.id}`);
    }
  }, [state?.success, state?.id, isEdit, router]);

  useEffect(() => {
    const t = includeTimer.current;
    if (t) clearTimeout(t);
    includeTimer.current = setTimeout(async () => {
      const q = includeSearch.trim();
      if (q.length < 2) {
        setIncludeHits([]);
        return;
      }
      const res = await fetch(`/api/admin/coupons/products?q=${encodeURIComponent(q)}`);
      if (!res.ok) return;
      const data = (await res.json()) as { products: CouponFormProduct[] };
      setIncludeHits(data.products ?? []);
    }, 280);
    return () => {
      if (includeTimer.current) clearTimeout(includeTimer.current);
    };
  }, [includeSearch]);

  useEffect(() => {
    const t = excludeTimer.current;
    if (t) clearTimeout(t);
    excludeTimer.current = setTimeout(async () => {
      const q = excludeSearch.trim();
      if (q.length < 2) {
        setExcludeHits([]);
        return;
      }
      const res = await fetch(`/api/admin/coupons/products?q=${encodeURIComponent(q)}`);
      if (!res.ok) return;
      const data = (await res.json()) as { products: CouponFormProduct[] };
      setExcludeHits(data.products ?? []);
    }, 280);
    return () => {
      if (excludeTimer.current) clearTimeout(excludeTimer.current);
    };
  }, [excludeSearch]);

  const valueForSubmit = useMemo(() => {
    if (type === "PERCENT") {
      const n = Math.round(Number.parseFloat(percentVal) || 0);
      return String(Math.min(100, Math.max(0, n)));
    }
    const dollars = Number.parseFloat(fixedDollars) || 0;
    return String(Math.round(dollars * 100));
  }, [type, percentVal, fixedDollars]);

  const minOrderCents = Math.max(0, Math.round((Number.parseFloat(minSpendDollars) || 0) * 100));
  const maxOrderCentsStr = useMemo(() => {
    const t = maxSpendDollars.trim();
    if (!t) return "";
    const cents = Math.round((Number.parseFloat(t) || 0) * 100);
    return String(Math.max(0, cents));
  }, [maxSpendDollars]);

  function addIncludeProduct(p: CouponFormProduct) {
    setIncludeProducts((prev) => {
      if (prev.some((x) => x.id === p.id)) return prev;
      return [...prev, p];
    });
    setIncludeSearch("");
    setIncludeHits([]);
  }

  function addExcludeProduct(p: CouponFormProduct) {
    setExcludeProducts((prev) => {
      if (prev.some((x) => x.id === p.id)) return prev;
      return [...prev, p];
    });
    setExcludeSearch("");
    setExcludeHits([]);
  }

  function toggleCat(set: Set<string>, mut: (next: Set<string>) => void, id: string) {
    const next = new Set(set);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    mut(next);
  }

  const tabBtn = (id: TabId, label: string) => (
    <button
      key={id}
      type="button"
      onClick={() => setTab(id)}
      className={`block w-full border-b border-[#dcdcde] px-3 py-2.5 text-left text-sm last:border-b-0 ${
        tab === id ? "border-l-4 border-l-[#2271b1] bg-[#f0f6fc] font-medium text-[#1d2327]" : "text-[#50575e] hover:bg-[#f6f7f7]"
      }`}
    >
      {label}
    </button>
  );

  return (
    <form action={act} className="space-y-6">
      <div className="hidden" aria-hidden>
        {coupon ? <input type="hidden" name="id" value={coupon.id} /> : null}
        <input type="hidden" name="code" value={code.trim()} />
        <input type="hidden" name="description" value={description} />
        <input type="hidden" name="type" value={type} />
        <input type="hidden" name="value" value={valueForSubmit} />
        <input type="hidden" name="minOrderCents" value={String(minOrderCents)} />
        <input type="hidden" name="maxOrderCents" value={maxOrderCentsStr} />
        <input type="hidden" name="maxRedemptions" value={maxRedemptions.trim()} />
        <input type="hidden" name="usageLimitPerUser" value={usageLimitPerUser.trim()} />
        <input type="hidden" name="startsAt" value={startsLocal} />
        <input type="hidden" name="endsAt" value={endsLocal} />
        <input type="hidden" name="active" value={active ? "on" : ""} />
        <input type="hidden" name="freeShipping" value={freeShipping ? "on" : ""} />
        <input type="hidden" name="excludeSaleItems" value={excludeSaleItems ? "on" : ""} />
        <input type="hidden" name="allowedEmails" value={allowedEmails} />
        <input type="hidden" name="includeProductIds" value={JSON.stringify(includeProducts.map((p) => p.id))} />
        <input type="hidden" name="excludeProductIds" value={JSON.stringify(excludeProducts.map((p) => p.id))} />
        <input type="hidden" name="includeCategoryIds" value={JSON.stringify([...includeCategoryIds])} />
        <input type="hidden" name="excludeCategoryIds" value={JSON.stringify([...excludeCategoryIds])} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[220px_1fr_280px]">
      <div className="rounded-xl border border-[#dcdcde] bg-white shadow-[0_1px_0_rgba(0,0,0,0.02)]">
        <nav aria-label="Coupon sections">{tabBtn("general", "General")}</nav>
        <nav aria-label="Coupon restrictions">{tabBtn("restrictions", "Usage restriction")}</nav>
        <nav aria-label="Coupon limits">{tabBtn("limits", "Usage limits")}</nav>
      </div>

      <div className="space-y-6">
        {state?.error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900" role="alert">
            {state.error}
          </div>
        ) : null}

        {tab === "general" ? (
          <div className="rounded-xl border border-[#dcdcde] bg-white p-5 shadow-[0_1px_0_rgba(0,0,0,0.02)]">
            <h2 className="text-lg font-semibold text-[#1d2327]">General</h2>
            <div className="mt-4 space-y-4">
              <div>
                <Label htmlFor="codeVisible">Coupon code</Label>
                <div className="mt-1 flex flex-wrap gap-2">
                  <Input
                    id="codeVisible"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="max-w-md font-mono uppercase"
                    autoComplete="off"
                    required
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="shrink-0"
                    onClick={() => setCode(randomCouponCode())}
                  >
                    Generate coupon code
                  </Button>
                </div>
              </div>
              <div>
                <Label htmlFor="desc">Description (optional)</Label>
                <Textarea
                  id="desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="mt-1 min-h-[100px]"
                  maxLength={500}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="dtype">Discount type</Label>
                  <select
                    id="dtype"
                    value={type}
                    onChange={(e) => setType(e.target.value as "PERCENT" | "FIXED")}
                    className="mt-1 w-full rounded-md border border-[#8c8f94] bg-white px-2 py-2 text-sm"
                  >
                    <option value="PERCENT">Percentage discount</option>
                    <option value="FIXED">Fixed cart discount</option>
                  </select>
                </div>
                {type === "PERCENT" ? (
                  <div>
                    <Label htmlFor="pct">Coupon amount (%)</Label>
                    <Input
                      id="pct"
                      type="number"
                      min={0}
                      max={100}
                      step={1}
                      value={percentVal}
                      onChange={(e) => setPercentVal(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                ) : (
                  <div>
                    <Label htmlFor="fix">Coupon amount (USD)</Label>
                    <Input
                      id="fix"
                      type="number"
                      min={0}
                      step="0.01"
                      value={fixedDollars}
                      onChange={(e) => setFixedDollars(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                )}
              </div>
              <label className="flex items-start gap-2 text-sm">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4"
                  checked={freeShipping}
                  onChange={(e) => setFreeShipping(e.target.checked)}
                />
                <span>
                  Allow free shipping — when this coupon applies, flat shipping is waived (threshold-based free
                  shipping still applies when the coupon does not).
                </span>
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="starts">Starts at (optional)</Label>
                  <Input
                    id="starts"
                    type="datetime-local"
                    value={startsLocal}
                    onChange={(e) => setStartsLocal(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="ends">Ends at (optional)</Label>
                  <Input
                    id="ends"
                    type="datetime-local"
                    value={endsLocal}
                    onChange={(e) => setEndsLocal(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {tab === "restrictions" ? (
          <div className="rounded-xl border border-[#dcdcde] bg-white p-5 shadow-[0_1px_0_rgba(0,0,0,0.02)]">
            <h2 className="text-lg font-semibold text-[#1d2327]">Usage restriction</h2>
            <p className="mt-1 text-xs text-[#50575e]">
              Exclusions take precedence. Empty include lists mean &quot;any&quot; for that dimension.
            </p>
            <div className="mt-4 space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="minspend">Minimum spend (USD)</Label>
                  <Input
                    id="minspend"
                    type="number"
                    min={0}
                    step="0.01"
                    value={minSpendDollars}
                    onChange={(e) => setMinSpendDollars(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="maxspend">Maximum spend (USD)</Label>
                  <Input
                    id="maxspend"
                    type="number"
                    min={0}
                    step="0.01"
                    value={maxSpendDollars}
                    onChange={(e) => setMaxSpendDollars(e.target.value)}
                    placeholder="No maximum"
                    className="mt-1"
                  />
                </div>
              </div>
              <label className="flex items-start gap-2 text-sm">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4"
                  checked={excludeSaleItems}
                  onChange={(e) => setExcludeSaleItems(e.target.checked)}
                />
                <span>Exclude sale items — do not apply this coupon to discounted line items.</span>
              </label>
              <div>
                <Label>Products (include)</Label>
                <Input
                  className="mt-1"
                  placeholder="Search for a product…"
                  value={includeSearch}
                  onChange={(e) => setIncludeSearch(e.target.value)}
                />
                {includeHits.length > 0 ? (
                  <ul className="mt-1 max-h-40 overflow-auto rounded border border-[#dcdcde] bg-white text-sm">
                    {includeHits.map((p) => (
                      <li key={p.id}>
                        <button
                          type="button"
                          className="w-full px-2 py-1.5 text-left hover:bg-[#f0f6fc]"
                          onClick={() => addIncludeProduct(p)}
                        >
                          {p.name}{" "}
                          <span className="text-[#787c82]">({p.slug})</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : null}
                <div className="mt-2 flex flex-wrap gap-1">
                  {includeProducts.map((p) => (
                    <span
                      key={p.id}
                      className="inline-flex items-center gap-1 rounded-full bg-[#f0f6fc] px-2 py-0.5 text-xs"
                    >
                      {p.name}
                      <button
                        type="button"
                        className="font-bold text-[#2271b1]"
                        aria-label={`Remove ${p.name}`}
                        onClick={() => setIncludeProducts((prev) => prev.filter((x) => x.id !== p.id))}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <Label>Exclude products</Label>
                <Input
                  className="mt-1"
                  placeholder="Search for a product…"
                  value={excludeSearch}
                  onChange={(e) => setExcludeSearch(e.target.value)}
                />
                {excludeHits.length > 0 ? (
                  <ul className="mt-1 max-h-40 overflow-auto rounded border border-[#dcdcde] bg-white text-sm">
                    {excludeHits.map((p) => (
                      <li key={p.id}>
                        <button
                          type="button"
                          className="w-full px-2 py-1.5 text-left hover:bg-[#f0f6fc]"
                          onClick={() => addExcludeProduct(p)}
                        >
                          {p.name}{" "}
                          <span className="text-[#787c82]">({p.slug})</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : null}
                <div className="mt-2 flex flex-wrap gap-1">
                  {excludeProducts.map((p) => (
                    <span
                      key={p.id}
                      className="inline-flex items-center gap-1 rounded-full bg-[#fcf0f1] px-2 py-0.5 text-xs"
                    >
                      {p.name}
                      <button
                        type="button"
                        className="font-bold text-[#b32d2e]"
                        aria-label={`Remove ${p.name}`}
                        onClick={() => setExcludeProducts((prev) => prev.filter((x) => x.id !== p.id))}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
              <div className="border-t border-[#dcdcde] pt-4">
                <Label className="text-[#50575e]">Product categories (include)</Label>
                <div className="mt-2 max-h-48 space-y-1 overflow-auto rounded border border-[#dcdcde] p-2 text-sm">
                  {categories.map((c) => (
                    <label key={c.id} className="flex cursor-pointer items-center gap-2 py-0.5">
                      <input
                        type="checkbox"
                        checked={includeCategoryIds.has(c.id)}
                        onChange={() =>
                          toggleCat(includeCategoryIds, (next) => setIncludeCategoryIds(next), c.id)
                        }
                      />
                      {c.name}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <Label className="text-[#50575e]">Exclude categories</Label>
                <div className="mt-2 max-h-48 space-y-1 overflow-auto rounded border border-[#dcdcde] p-2 text-sm">
                  {categories.map((c) => (
                    <label key={`ex-${c.id}`} className="flex cursor-pointer items-center gap-2 py-0.5">
                      <input
                        type="checkbox"
                        checked={excludeCategoryIds.has(c.id)}
                        onChange={() =>
                          toggleCat(excludeCategoryIds, (next) => setExcludeCategoryIds(next), c.id)
                        }
                      />
                      {c.name}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <Label htmlFor="emails">Allowed emails</Label>
                <Input
                  id="emails"
                  placeholder="No restrictions — or comma-separated emails"
                  value={allowedEmails}
                  onChange={(e) => setAllowedEmails(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
          </div>
        ) : null}

        {tab === "limits" ? (
          <div className="rounded-xl border border-[#dcdcde] bg-white p-5 shadow-[0_1px_0_rgba(0,0,0,0.02)]">
            <h2 className="text-lg font-semibold text-[#1d2327]">Usage limits</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="maxred">Usage limit per coupon (optional)</Label>
                <Input
                  id="maxred"
                  type="number"
                  min={1}
                  step={1}
                  value={maxRedemptions}
                  onChange={(e) => setMaxRedemptions(e.target.value)}
                  placeholder="Unlimited"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="peruser">Usage limit per user (optional)</Label>
                <Input
                  id="peruser"
                  type="number"
                  min={1}
                  step={1}
                  value={usageLimitPerUser}
                  onChange={(e) => setUsageLimitPerUser(e.target.value)}
                  placeholder="Unlimited"
                  className="mt-1"
                />
              </div>
            </div>
          </div>
        ) : null}

        <div className="lg:hidden">
          <Button type="submit" disabled={pending} className="w-full bg-[#2271b1] hover:bg-[#135e96]">
            {pending ? "Saving…" : isEdit ? "Update coupon" : "Publish coupon"}
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-[#dcdcde] bg-white p-4 shadow-[0_1px_0_rgba(0,0,0,0.02)]">
        <h2 className="text-sm font-semibold text-[#1d2327]">Publish</h2>
        <div className="mt-3 space-y-2 text-sm text-[#50575e]">
          <div>
            <span className="font-medium text-[#1d2327]">Status:</span> {active ? "Active" : "Inactive"}
          </div>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
            Active (visible to checkout when dates allow)
          </label>
        </div>
        <Button type="submit" disabled={pending} className="mt-4 w-full bg-[#2271b1] hover:bg-[#135e96]">
          {pending ? "Saving…" : isEdit ? "Update coupon" : "Publish coupon"}
        </Button>
        <p className="mt-3 text-xs text-[#787c82]">
          <Link href="/admin/coupons" className="text-[#2271b1] hover:underline">
            ← Back to coupons
          </Link>
        </p>
      </div>
      </div>
    </form>
  );
}
