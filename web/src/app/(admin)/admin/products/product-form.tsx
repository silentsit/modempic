"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ProductStatus } from "@prisma/client";
import { tiersFromProduct } from "@/lib/catalog/product-variant-store";
import { VariantTierBuilder } from "./_components/variant-tier-builder";
import { BodyHtmlField } from "./_components/body-html-field";
import { ProductPublishChecklist } from "./_components/product-publish-checklist";

export type AdminCategoryOption = { id: string; slug: string; name: string };

export type ProductFormValues = {
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
  featuredImageUrl: string;
  featuredImageAlt: string;
  galleryUrlsText: string;
  galleryAltsText: string;
  disclaimer: string;
  purity: string;
  testingStatus: string;
  coaUrl: string;
  storageNotes: string;
  specifications: unknown;
  shippingRestrictions: string;
  variants: unknown;
  sku?: string | null;
  productVariants?: {
    sku: string;
    label: string;
    priceCents: number;
    compareAtCents: number | null;
    variantKey: string;
    sortOrder: number;
    active: boolean;
  }[];
  seoTitle: string;
  seoDesc: string;
  initialCategorySlugs: string[];
};

function slugify(raw: string) {
  return raw
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 180);
}

function dollarsFromCents(cents: number | null | undefined) {
  if (cents == null || cents < 0) return "";
  return (cents / 100).toFixed(2);
}

function formatJsonForTextarea(value: unknown) {
  if (value == null) return "";
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return "";
  }
}

export function ProductForm({
  action,
  product,
  allCategories,
}: {
  action: (s: { error?: string; success?: string; id?: string } | null, formData: FormData) => Promise<{ error?: string; success?: string; id?: string } | null>;
  product?: ProductFormValues;
  allCategories: AdminCategoryOption[];
}) {
  const router = useRouter();
  const p = product;
  const [state, act, pending] = useActionState(action, null);

  const initialTiers = useMemo(
    () =>
      p
        ? tiersFromProduct({
            priceCents: p.priceCents,
            compareAtCents: p.compareAtCents,
            variants: p.variants,
            productVariants: p.productVariants,
            name: p.name,
          })
        : [],
    [p],
  );
  const initialVariable = initialTiers.length >= 2;

  const [name, setName] = useState(p?.name ?? "");
  const [slug, setSlug] = useState(p?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(p?.slug));

  const [productType, setProductType] = useState<"simple" | "variable">(initialVariable ? "variable" : "simple");
  const [status, setStatus] = useState(p?.status ?? ProductStatus.DRAFT);
  const [seoTitle, setSeoTitle] = useState(p?.seoTitle ?? "");
  const [seoDesc, setSeoDesc] = useState(p?.seoDesc ?? "");
  const [disclaimer, setDisclaimer] = useState(p?.disclaimer ?? "");
  const [coaUrl, setCoaUrl] = useState(p?.coaUrl ?? "");
  const [featuredImageUrl, setFeaturedImageUrl] = useState(p?.featuredImageUrl ?? "");
  const [featuredImageAlt, setFeaturedImageAlt] = useState(p?.featuredImageAlt ?? "");
  const [galleryUrls, setGalleryUrls] = useState(p?.galleryUrlsText ?? "");
  const [galleryAlts, setGalleryAlts] = useState(p?.galleryAltsText ?? "");
  const [categorySlugs, setCategorySlugs] = useState<string[]>(p?.initialCategorySlugs ?? []);
  const [tierCount, setTierCount] = useState(initialTiers.length >= 2 ? initialTiers.length : 0);

  useEffect(() => {
    if (!slugTouched) setSlug(slugify(name));
  }, [name, slugTouched]);

  useEffect(() => {
    if (state?.success && state?.id && !p?.id) {
      router.replace(`/admin/products/${state.id}`);
    }
  }, [state?.success, state?.id, p?.id, router]);

  return (
    <form key={p?.id ?? "new-product"} action={act} className="mt-6 space-y-6">
      {p?.id ? <input type="hidden" name="id" value={p.id} /> : null}
      {state?.error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900" role="alert">
          {state.error}
        </div>
      ) : null}
      {state?.success && p?.id ? (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-900" role="status">
          {state.success}
        </div>
      ) : null}

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-8">
          <section className="rounded-xl border border-[#dcdcde] bg-white p-5 shadow-[0_1px_0_rgba(0,0,0,0.02)]">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-[#50575e]">Product data</h2>
            <div className="mt-4 space-y-4">
              <div>
                <Label htmlFor="name">Product name</Label>
                <Input
                  id="name"
                  name="name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="slug">Slug (URL)</Label>
                <Input
                  id="slug"
                  name="slug"
                  required
                  value={slug}
                  onChange={(e) => {
                    setSlugTouched(true);
                    setSlug(e.target.value);
                  }}
                  className="mt-1.5 font-mono text-sm"
                />
                <p className="mt-1 text-xs text-[#50575e]">Auto-updates from the name until you edit this field.</p>
              </div>

              <fieldset className="space-y-2">
                <legend className="text-sm font-medium text-[#1d2327]">Product type</legend>
                <div className="flex flex-wrap gap-4 text-sm">
                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      type="radio"
                      name="productType"
                      value="simple"
                      checked={productType === "simple"}
                      onChange={() => {
                        setProductType("simple");
                        setTierCount(1);
                      }}
                    />
                    Simple — one base price (optional compare-at sale)
                  </label>
                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      type="radio"
                      name="productType"
                      value="variable"
                      checked={productType === "variable"}
                      onChange={() => setProductType("variable")}
                    />
                    Variable — multiple price tiers (packs / sizes)
                  </label>
                </div>
              </fieldset>

              {productType === "simple" ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="regularPrice">Regular price (USD)</Label>
                    <Input
                      id="regularPrice"
                      name="regularPrice"
                      required
                      inputMode="decimal"
                      defaultValue={dollarsFromCents(p?.priceCents) || ""}
                      placeholder="35.00"
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label htmlFor="compareAtPrice">Compare-at / list price (USD, optional)</Label>
                    <Input
                      id="compareAtPrice"
                      name="compareAtPrice"
                      inputMode="decimal"
                      defaultValue={dollarsFromCents(p?.compareAtCents) || ""}
                      placeholder="55.00"
                      className="mt-1.5"
                    />
                    <p className="mt-1 text-xs text-[#50575e]">Must be higher than the regular price if set.</p>
                  </div>
                </div>
              ) : (
                <VariantTierBuilder
                  key={p?.id ?? "new"}
                  initialTiers={initialTiers}
                  onTierCountChange={setTierCount}
                />
              )}
            </div>
          </section>

          <section className="rounded-xl border border-[#dcdcde] bg-white p-5 shadow-[0_1px_0_rgba(0,0,0,0.02)]">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-[#50575e]">Descriptions</h2>
            <div className="mt-4 space-y-4">
              <div>
                <Label htmlFor="shortDesc">Short description</Label>
                <Textarea id="shortDesc" name="shortDesc" required defaultValue={p?.shortDesc} className="mt-1.5" rows={3} />
                <p className="mt-1 text-xs text-[#50575e]">Plain text; appears on listings and cards. Use line breaks sparingly.</p>
              </div>
              <div>
                <Label htmlFor="longDesc">Long description</Label>
                <Textarea id="longDesc" name="longDesc" required defaultValue={p?.longDesc} className="mt-1.5" rows={8} />
                <p className="mt-1 text-xs text-[#50575e]">
                  Plain text for the “Overview” tab. Separate paragraphs with a <strong>blank line</strong> (two line breaks).
                </p>
              </div>
              <BodyHtmlField key={p?.id ?? "new"} defaultValue={p?.bodyHtml ?? ""} />
              <div>
                <Label htmlFor="disclaimer">Disclaimer</Label>
                <Textarea
                  id="disclaimer"
                  name="disclaimer"
                  value={disclaimer}
                  onChange={(e) => setDisclaimer(e.target.value)}
                  className="mt-1.5"
                  rows={2}
                />
                <p className="mt-1 text-xs text-[#50575e]">
                  Optional product notice shown on the storefront when set.
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-[#dcdcde] bg-white p-5 shadow-[0_1px_0_rgba(0,0,0,0.02)]">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-[#50575e]">Catalog details</h2>
            <div className="mt-4 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="purity">Purity / concentration</Label>
                  <Input
                    id="purity"
                    name="purity"
                    defaultValue={p?.purity ?? ""}
                    placeholder="e.g. 99%+ HPLC"
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="testingStatus">Testing status</Label>
                  <Input
                    id="testingStatus"
                    name="testingStatus"
                    defaultValue={p?.testingStatus ?? ""}
                    placeholder="e.g. Third-party tested"
                    className="mt-1.5"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="coaUrl">COA URL</Label>
                <Input
                  id="coaUrl"
                  name="coaUrl"
                  type="url"
                  value={coaUrl}
                  onChange={(e) => setCoaUrl(e.target.value)}
                  placeholder="https://..."
                  className="mt-1.5 font-mono text-xs"
                />
                <p className="mt-1 text-xs text-[#50575e]">Optional, but must use HTTPS when set.</p>
              </div>
              <div>
                <Label htmlFor="storageNotes">Storage notes</Label>
                <Textarea
                  id="storageNotes"
                  name="storageNotes"
                  defaultValue={p?.storageNotes ?? ""}
                  className="mt-1.5"
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="shippingRestrictions">Shipping restrictions</Label>
                <Textarea
                  id="shippingRestrictions"
                  name="shippingRestrictions"
                  defaultValue={p?.shippingRestrictions ?? ""}
                  className="mt-1.5"
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="specificationsJson">Specifications JSON</Label>
                <Textarea
                  id="specificationsJson"
                  name="specificationsJson"
                  defaultValue={formatJsonForTextarea(p?.specifications)}
                  placeholder={'{\n  "molecularWeight": "...",\n  "form": "Lyophilized powder"\n}'}
                  className="mt-1.5 font-mono text-xs"
                  rows={6}
                />
                <p className="mt-1 text-xs text-[#50575e]">
                  Flexible structured specs for PDP rendering. Leave blank if not applicable.
                </p>
              </div>
            </div>
          </section>
        </div>

        <aside className="space-y-5 lg:sticky lg:top-20 lg:self-start">
          <section className="rounded-xl border border-[#dcdcde] bg-white p-4 shadow-[0_1px_0_rgba(0,0,0,0.02)]">
            <h2 className="text-sm font-semibold text-[#1d2327]">Publish</h2>
            <p className="mt-1 text-xs leading-5 text-[#50575e]">
              Published products require a category, SEO title and description, HTTPS featured image, and alt text for
              every product image.
            </p>
            <div className="mt-3 space-y-3">
              <div>
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  name="status"
                  className="mt-1.5 flex h-10 w-full rounded-lg border border-[#8c8f94] bg-white px-3 text-sm"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as ProductStatus)}
                >
                  {Object.values(ProductStatus).map((s) => (
                    <option key={s} value={s}>
                      {s === "DRAFT" ? "Draft" : "Published"}
                    </option>
                  ))}
                </select>
              </div>
              <label className="flex items-center gap-2 text-sm text-[#1d2327]">
                <input type="checkbox" name="isBestSeller" defaultChecked={p?.isBestSeller} className="h-4 w-4 rounded border-[#8c8f94]" />
                Best seller
              </label>
              <Button type="submit" className="w-full" disabled={pending}>
                {pending ? "Saving…" : p?.id ? "Update product" : "Create product"}
              </Button>
            </div>
            <ProductPublishChecklist
              status={status}
              seoTitle={seoTitle}
              seoDesc={seoDesc}
              disclaimer={disclaimer}
              coaUrl={coaUrl}
              categorySlugs={categorySlugs}
              featuredImageUrl={featuredImageUrl}
              featuredImageAlt={featuredImageAlt}
              galleryUrls={galleryUrls}
              galleryAlts={galleryAlts}
              productType={productType}
              tierCount={productType === "variable" ? tierCount : 1}
            />
          </section>

          <section className="rounded-xl border border-[#dcdcde] bg-white p-4 shadow-[0_1px_0_rgba(0,0,0,0.02)]">
            <h2 className="text-sm font-semibold text-[#1d2327]">Product image</h2>
            <p className="mt-1 text-xs text-[#50575e]">HTTPS URLs (e.g. Cloudinary). First image is the storefront thumbnail.</p>
            <div className="mt-3">
              <Label htmlFor="featuredImageUrl">Featured image URL</Label>
              <Input
                id="featuredImageUrl"
                name="featuredImageUrl"
                required
                type="url"
                value={featuredImageUrl}
                onChange={(e) => setFeaturedImageUrl(e.target.value)}
                placeholder="https://res.cloudinary.com/…"
                className="mt-1.5 font-mono text-xs"
              />
            </div>
            <div className="mt-4">
              <Label htmlFor="featuredImageAlt">Featured image alt text</Label>
              <Input
                id="featuredImageAlt"
                name="featuredImageAlt"
                value={featuredImageAlt}
                onChange={(e) => setFeaturedImageAlt(e.target.value)}
                placeholder="Describe the product image for accessibility"
                className="mt-1.5"
              />
              <p className="mt-1 text-xs text-[#50575e]">Required before publishing.</p>
            </div>
            <div className="mt-4">
              <Label htmlFor="galleryUrls">Gallery URLs (optional)</Label>
              <Textarea
                id="galleryUrls"
                name="galleryUrls"
                rows={5}
                value={galleryUrls}
                onChange={(e) => setGalleryUrls(e.target.value)}
                placeholder="One HTTPS URL per line (extra images after the featured image)"
                className="mt-1.5 font-mono text-xs"
              />
            </div>
            <div className="mt-4">
              <Label htmlFor="galleryAlts">Gallery alt text (one per gallery URL)</Label>
              <Textarea
                id="galleryAlts"
                name="galleryAlts"
                rows={5}
                value={galleryAlts}
                onChange={(e) => setGalleryAlts(e.target.value)}
                placeholder="One image description per gallery URL"
                className="mt-1.5 text-xs"
              />
            </div>
          </section>

          <section className="rounded-xl border border-[#dcdcde] bg-white p-4 shadow-[0_1px_0_rgba(0,0,0,0.02)]">
            <h2 className="text-sm font-semibold text-[#1d2327]">Product categories</h2>
            <p className="mt-1 text-xs text-[#50575e]">Checked categories apply when you save.</p>
            <div className="mt-3 max-h-52 space-y-2 overflow-y-auto pr-1">
              {allCategories.length === 0 ? (
                <p className="text-sm text-[#50575e]">No categories in the database yet.</p>
              ) : (
                allCategories.map((c) => (
                  <label key={c.id} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      name="categories"
                      value={c.slug}
                      checked={categorySlugs.includes(c.slug)}
                      onChange={(e) => {
                        setCategorySlugs((prev) =>
                          e.target.checked ? [...prev, c.slug] : prev.filter((s) => s !== c.slug),
                        );
                      }}
                      className="h-4 w-4 rounded border-[#8c8f94]"
                    />
                    <span>{c.name}</span>
                    <span className="text-xs text-[#8c8f94]">({c.slug})</span>
                  </label>
                ))
              )}
            </div>
          </section>

          <section className="rounded-xl border border-[#dcdcde] bg-white p-4 shadow-[0_1px_0_rgba(0,0,0,0.02)]">
            <h2 className="text-sm font-semibold text-[#1d2327]">SEO</h2>
            <div className="mt-3 space-y-3">
              <div>
                <Label htmlFor="seoTitle">SEO title (optional)</Label>
                <Input
                  id="seoTitle"
                  name="seoTitle"
                  value={seoTitle}
                  onChange={(e) => setSeoTitle(e.target.value)}
                  className="mt-1.5"
                />
                <p className="mt-1 text-xs text-[#646970]">Browser tab / search title when set.</p>
              </div>
              <div>
                <Label htmlFor="seoDesc">Meta description (optional)</Label>
                <Textarea
                  id="seoDesc"
                  name="seoDesc"
                  value={seoDesc}
                  onChange={(e) => setSeoDesc(e.target.value)}
                  className="mt-1.5"
                  rows={3}
                />
                <p className="mt-1 text-xs text-[#646970]">Roughly one to two sentences for search snippets.</p>
              </div>
            </div>
          </section>
        </aside>
      </div>
    </form>
  );
}
