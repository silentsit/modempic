"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ProductStatus } from "@prisma/client";

type P = {
  id?: string;
  name: string;
  slug: string;
  shortDesc: string;
  longDesc: string;
  bodyHtml: string;
  priceCents: number;
  compareAtCents: number | null;
  status: ProductStatus;
  isBestSeller: boolean;
  imageUrl: string;
  disclaimer: string;
  variants: string;
  seoTitle: string;
  seoDesc: string;
};

export function ProductForm({
  action,
  product,
}: {
  action: (s: { error?: string; success?: string; id?: string } | null, formData: FormData) => Promise<{ error?: string; success?: string; id?: string } | null>;
  product?: P;
}) {
  const p = product;
  const [state, act, pending] = useActionState(action, null);
  return (
    <form action={act} className="mt-6 max-w-xl space-y-3">
      {p?.id ? <input type="hidden" name="id" value={p.id} /> : null}
      {state?.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
      {state?.success ? <p className="text-sm text-green-700">{state.success}</p> : null}
      <div>
        <Label htmlFor="name">Name</Label>
        <Input id="name" name="name" required defaultValue={p?.name} className="mt-1" />
      </div>
      <div>
        <Label htmlFor="slug">Slug</Label>
        <Input id="slug" name="slug" required defaultValue={p?.slug} className="mt-1" />
      </div>
      <div>
        <Label htmlFor="shortDesc">Short description</Label>
        <Textarea id="shortDesc" name="shortDesc" required defaultValue={p?.shortDesc} className="mt-1" rows={2} />
      </div>
      <div>
        <Label htmlFor="longDesc">Long description</Label>
        <Textarea id="longDesc" name="longDesc" required defaultValue={p?.longDesc} className="mt-1" rows={6} />
      </div>
      <div>
        <Label htmlFor="bodyHtml">Body HTML (optional)</Label>
        <Textarea id="bodyHtml" name="bodyHtml" defaultValue={p?.bodyHtml} className="mt-1 font-mono text-sm" rows={6} />
      </div>
      <div>
        <Label htmlFor="priceCents">Price (cents, USD)</Label>
        <Input id="priceCents" name="priceCents" type="number" required defaultValue={p?.priceCents ?? 999} className="mt-1" />
      </div>
      <div>
        <Label htmlFor="compareAtCents">Compare-at price (cents, optional)</Label>
        <Input id="compareAtCents" name="compareAtCents" type="number" defaultValue={p?.compareAtCents ?? undefined} className="mt-1" />
      </div>
      <div>
        <Label htmlFor="status">Status</Label>
        <select
          id="status"
          name="status"
          className="mt-1 flex h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 text-sm"
          defaultValue={p?.status ?? "DRAFT"}
        >
          {Object.values(ProductStatus).map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="isBestSeller" defaultChecked={p?.isBestSeller} className="h-4 w-4" />
        Best seller
      </label>
      <div>
        <Label htmlFor="imageUrl">Image URL (optional, https)</Label>
        <Input id="imageUrl" name="imageUrl" type="url" defaultValue={p?.imageUrl} className="mt-1" />
      </div>
      <div>
        <Label htmlFor="disclaimer">Disclaimer (optional)</Label>
        <Textarea id="disclaimer" name="disclaimer" defaultValue={p?.disclaimer} className="mt-1" rows={2} />
      </div>
      <div>
        <Label htmlFor="variants">Variants JSON (optional)</Label>
        <Textarea
          id="variants"
          name="variants"
          defaultValue={p?.variants}
          className="mt-1 font-mono text-sm"
          rows={5}
          placeholder='[{"label":"30 pills","priceCents":4500}]'
        />
      </div>
      <div>
        <Label htmlFor="seoTitle">SEO title (optional)</Label>
        <Input id="seoTitle" name="seoTitle" defaultValue={p?.seoTitle} className="mt-1" />
      </div>
      <div>
        <Label htmlFor="seoDesc">SEO description (optional)</Label>
        <Textarea id="seoDesc" name="seoDesc" defaultValue={p?.seoDesc} className="mt-1" rows={2} />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save"}
      </Button>
    </form>
  );
}
