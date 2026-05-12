import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { prisma } from "@/lib/db";
import { formatUsd } from "@/lib/domain/money";
import { productImageDeliveryUrl } from "@/lib/cloudinary-delivery-url";
import { ProductStatus, Prisma } from "@prisma/client";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function getParam(params: Awaited<SearchParams>, key: string) {
  const value = params[key];
  return Array.isArray(value) ? value[0] : value;
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(value);
}

function statusLabel(status: ProductStatus) {
  return status.charAt(0) + status.slice(1).toLowerCase();
}

type SeoSignals = {
  score: number;
  keyword: string | null;
  schema: string;
  internalLinks: number;
  externalLinks: number;
  imageRefs: number;
};

function computeSeo(product: {
  name: string;
  slug: string;
  shortDesc: string;
  longDesc: string;
  bodyHtml: string | null;
  seoTitle: string | null;
  seoDesc: string | null;
  images: { id: string }[];
  categories: unknown[];
}): SeoSignals {
  let score = 0;
  if (product.seoTitle && product.seoTitle.length >= 35 && product.seoTitle.length <= 70) score += 20;
  else if (product.seoTitle) score += 10;
  if (product.seoDesc && product.seoDesc.length >= 100 && product.seoDesc.length <= 170) score += 20;
  else if (product.seoDesc) score += 10;
  if (product.shortDesc.length >= 60) score += 10;
  if ((product.longDesc?.length ?? 0) >= 250 || (product.bodyHtml?.length ?? 0) >= 500) score += 15;
  if (product.images.length >= 1) score += 10;
  if (product.images.length >= 3) score += 5;
  if (product.categories.length >= 1) score += 10;
  const html = product.bodyHtml ?? "";
  const internalLinks = (html.match(/href=["'](?:\/|https?:\/\/(?:www\.)?modempic)/gi) ?? []).length;
  const externalLinks = (html.match(/href=["']https?:\/\//gi) ?? []).length - internalLinks;
  if (internalLinks >= 1) score += 5;
  if (externalLinks >= 1) score += 5;
  score = Math.min(100, score);
  return {
    score,
    keyword: product.seoTitle ?? product.name ?? null,
    schema: "Product",
    internalLinks: Math.max(0, internalLinks),
    externalLinks: Math.max(0, externalLinks),
    imageRefs: product.images.length,
  };
}

function scoreColor(score: number) {
  if (score >= 80) return "bg-[#0a6b3b] text-white";
  if (score >= 60) return "bg-[#dba617] text-white";
  if (score >= 40) return "bg-[#dba617]/80 text-white";
  return "bg-[#d63638] text-white";
}

export default async function AdminProductsPage({ searchParams }: { searchParams?: SearchParams }) {
  const params = searchParams ? await searchParams : {};
  const status = getParam(params, "status");
  const category = getParam(params, "category");
  const query = getParam(params, "s")?.trim();

  const where: Prisma.ProductWhereInput = {
    ...(status && Object.values(ProductStatus).includes(status as ProductStatus)
      ? { status: status as ProductStatus }
      : {}),
    ...(category
      ? {
          categories: {
            some: {
              category: { slug: category },
            },
          },
        }
      : {}),
    ...(query
      ? {
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { slug: { contains: query, mode: "insensitive" } },
            { shortDesc: { contains: query, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [products, categories, total, published, draft] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      include: {
        images: { orderBy: { sortOrder: "asc" } },
        categories: { include: { category: true } },
      },
    }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.product.count(),
    prisma.product.count({ where: { status: ProductStatus.PUBLISHED } }),
    prisma.product.count({ where: { status: ProductStatus.DRAFT } }),
  ]);

  const activeStatus = status && Object.values(ProductStatus).includes(status as ProductStatus) ? status : "";

  return (
    <div className="space-y-4">
      {/* Page header card */}
      <div className="rounded-xl border border-[#dcdcde] bg-white px-5 py-4 shadow-[0_1px_0_rgba(0,0,0,0.02)]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight text-[#1d2327]">Products</h1>
            <Link
              href="/admin/products/new"
              className="rounded-md bg-[#2271b1] px-2.5 py-1 text-xs font-semibold text-white shadow-sm hover:bg-[#135e96]"
            >
              Add new product
            </Link>
            <button
              type="button"
              className="rounded-md border border-[#dcdcde] bg-white px-2.5 py-1 text-xs font-medium text-[#2271b1] hover:bg-[#f6f7f7]"
            >
              Import
            </button>
            <button
              type="button"
              className="rounded-md border border-[#dcdcde] bg-white px-2.5 py-1 text-xs font-medium text-[#2271b1] hover:bg-[#f6f7f7]"
            >
              Export
            </button>
          </div>
          <form action="/admin/products" className="flex w-full gap-1 sm:w-auto">
            {activeStatus ? <input type="hidden" name="status" value={activeStatus} /> : null}
            {category ? <input type="hidden" name="category" value={category} /> : null}
            <input
              type="search"
              name="s"
              defaultValue={query}
              placeholder="Search products"
              className="h-8 w-full rounded-md border border-[#8c8f94] bg-white px-2 text-sm sm:w-64"
              aria-label="Search products"
            />
            <button className="h-8 shrink-0 rounded-md border border-[#dcdcde] bg-white px-3 text-xs font-medium text-[#2271b1] hover:bg-[#f6f7f7]">
              Search
            </button>
          </form>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#50575e]">
          <Link
            href="/admin/products"
            className={!activeStatus ? "font-semibold text-[#1d2327]" : "text-[#2271b1] hover:underline"}
          >
            All <span className="text-[#8c8f94]">({total})</span>
          </Link>
          <span className="text-[#dcdcde]" aria-hidden>
            |
          </span>
          <Link
            href="/admin/products?status=PUBLISHED"
            className={
              activeStatus === ProductStatus.PUBLISHED ? "font-semibold text-[#1d2327]" : "text-[#2271b1] hover:underline"
            }
          >
            Published <span className="text-[#8c8f94]">({published})</span>
          </Link>
          <span className="text-[#dcdcde]" aria-hidden>
            |
          </span>
          <Link
            href="/admin/products?status=DRAFT"
            className={
              activeStatus === ProductStatus.DRAFT ? "font-semibold text-[#1d2327]" : "text-[#2271b1] hover:underline"
            }
          >
            Draft <span className="text-[#8c8f94]">({draft})</span>
          </Link>
          <span className="text-[#dcdcde]" aria-hidden>
            |
          </span>
          <span className="text-[#50575e]">Pillar Content (0)</span>
          <span className="text-[#dcdcde]" aria-hidden>
            |
          </span>
          <span className="font-semibold text-[#1d2327]">Sorting</span>
        </div>
      </div>

      {/* Filters */}
      <form
        action="/admin/products"
        className="rounded-xl border border-[#dcdcde] bg-white px-5 py-3 shadow-[0_1px_0_rgba(0,0,0,0.02)]"
      >
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <select
            className="h-8 rounded-md border border-[#8c8f94] bg-white px-2 text-sm"
            aria-label="Bulk actions"
            defaultValue=""
          >
            <option value="">Bulk actions</option>
            <option value="edit">Edit</option>
            <option value="trash">Move to trash</option>
          </select>
          <button
            type="button"
            className="h-8 rounded-md border border-[#dcdcde] bg-white px-3 text-xs font-medium text-[#2271b1] hover:bg-[#f6f7f7]"
          >
            Apply
          </button>

          <select
            name="category"
            defaultValue={category ?? ""}
            className="h-8 rounded-md border border-[#8c8f94] bg-white px-2 text-sm"
            aria-label="Filter by category"
          >
            <option value="">Select a category</option>
            {categories.map((c) => (
              <option key={c.id} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            className="h-8 rounded-md border border-[#8c8f94] bg-white px-2 text-sm"
            aria-label="Filter by product type"
            defaultValue=""
          >
            <option value="">Filter by product type</option>
            <option>Simple product</option>
            <option>Variable product</option>
          </select>

          <select
            className="h-8 rounded-md border border-[#8c8f94] bg-white px-2 text-sm"
            aria-label="Filter by stock status"
            defaultValue=""
          >
            <option value="">Filter by stock status</option>
            <option>In stock</option>
            <option>Out of stock</option>
          </select>

          <select
            className="h-8 rounded-md border border-[#8c8f94] bg-white px-2 text-sm"
            aria-label="Filter by brand"
            defaultValue=""
          >
            <option value="">Filter by brand</option>
            <option>Modempic</option>
            <option>HAB Pharma</option>
            <option>Sun Pharma</option>
          </select>

          <select
            name="status"
            defaultValue={activeStatus}
            className="h-8 rounded-md border border-[#8c8f94] bg-white px-2 text-sm"
            aria-label="Filter by status"
          >
            <option value="">Rank Math</option>
            {Object.values(ProductStatus).map((s) => (
              <option key={s} value={s}>
                {statusLabel(s)}
              </option>
            ))}
          </select>

          {query ? <input type="hidden" name="s" value={query} /> : null}
          <button className="h-8 rounded-md border border-[#dcdcde] bg-white px-3 font-medium text-[#2271b1] hover:bg-[#f6f7f7]">
            Filter
          </button>
          <p className="ml-auto text-xs text-[#50575e]">{products.length} items</p>
        </div>
      </form>

      {/* Products table */}
      <div className="overflow-hidden rounded-xl border border-[#dcdcde] bg-white shadow-[0_1px_0_rgba(0,0,0,0.02)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1280px] border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-[#dcdcde] bg-[#f6f7f7] text-[11px] uppercase tracking-wider text-[#50575e]">
                <th className="w-10 px-3 py-2.5 font-medium">
                  <input type="checkbox" aria-label="Select all products" />
                </th>
                <th className="w-14 px-3 py-2.5 font-medium">Image</th>
                <th className="px-3 py-2.5 font-medium">Name</th>
                <th className="px-3 py-2.5 font-medium">SKU</th>
                <th className="px-3 py-2.5 font-medium">Price</th>
                <th className="px-3 py-2.5 font-medium">Categories</th>
                <th className="px-3 py-2.5 font-medium">Date</th>
                <th className="px-3 py-2.5 font-medium">SEO Details</th>
                <th className="px-3 py-2.5 font-medium">SEO Title</th>
                <th className="px-3 py-2.5 font-medium">SEO Desc</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p, index) => {
                const image = p.images[0];
                const seo = computeSeo(p);
                return (
                  <tr
                    key={p.id}
                    className={`border-b border-[#f0f0f1] align-top transition-colors hover:bg-[#f9fafa] ${
                      index % 2 === 0 ? "bg-white" : "bg-[#fbfbfc]"
                    }`}
                  >
                    <td className="px-3 py-3">
                      <input type="checkbox" aria-label={`Select ${p.name}`} />
                    </td>
                    <td className="px-3 py-3">
                      {image ? (
                        // eslint-disable-next-line @next/next/no-img-element -- admin table can show remote product URLs.
                        <img
                          src={productImageDeliveryUrl(image.url, "adminThumb")}
                          alt={image.alt || p.name}
                          className="h-10 w-10 rounded-md border border-[#dcdcde] object-cover"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-md border border-[#dcdcde] bg-[#f0f0f1]" />
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <Link
                        href={`/admin/products/${p.id}`}
                        className="font-semibold text-[#2271b1] hover:underline"
                      >
                        {p.name}
                      </Link>
                      <div className="mt-1 flex items-center gap-1 text-[11px] text-[#646970]">
                        <Link href={`/admin/products/${p.id}`} className="text-[#2271b1] hover:underline">
                          Edit
                        </Link>
                        <span aria-hidden>|</span>
                        <Link href={`/product/${p.slug}`} className="inline-flex items-center gap-0.5 text-[#2271b1] hover:underline">
                          View
                          <ExternalLink className="h-2.5 w-2.5" />
                        </Link>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-[#50575e]">{p.slug}</td>
                    <td className="px-3 py-3">
                      {p.compareAtCents ? (
                        <div className="space-y-0.5">
                          <p className="text-[#787c82] line-through">{formatUsd(p.compareAtCents)}</p>
                          <p className="font-semibold text-[#1d2327]">{formatUsd(p.priceCents)}</p>
                        </div>
                      ) : (
                        <span className="font-semibold text-[#1d2327]">{formatUsd(p.priceCents)}</span>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      {p.categories.length ? (
                        <div className="flex flex-wrap gap-1">
                          {p.categories.map(({ category: c }) => (
                            <Link
                              key={c.id}
                              href={`/admin/products?category=${c.slug}`}
                              className="rounded bg-[#eef3f8] px-1.5 py-0.5 text-[11px] text-[#1c4a87] hover:bg-[#dde7f3]"
                            >
                              {c.name}
                            </Link>
                          ))}
                        </div>
                      ) : (
                        <span className="text-[#787c82]">Uncategorized</span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-[#50575e]">
                      <p className="font-medium text-[#1d2327]">{statusLabel(p.status)}</p>
                      <p className="text-[11px]">{formatDate(p.updatedAt)}</p>
                    </td>
                    <td className="px-3 py-3">
                      <div className="space-y-1.5">
                        <span
                          className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold ${scoreColor(seo.score)}`}
                        >
                          {seo.score} / 100
                        </span>
                        <p className="text-[11px] text-[#50575e]">
                          <span className="font-semibold text-[#1d2327]">Keyword:</span>{" "}
                          {seo.keyword ? seo.keyword.toLowerCase().slice(0, 38) : "—"}
                        </p>
                        <p className="text-[11px] text-[#50575e]">
                          <span className="font-semibold text-[#1d2327]">Schema:</span> WooCommerce {seo.schema}
                        </p>
                        <div className="flex items-center gap-2 text-[11px] text-[#50575e]">
                          <span className="font-semibold text-[#1d2327]">Links:</span>
                          <span title="Internal">↺ {seo.internalLinks}</span>
                          <span title="External">↗ {seo.externalLinks}</span>
                          <span title="Images">▣ {seo.imageRefs}</span>
                        </div>
                      </div>
                    </td>
                    <td className="max-w-[180px] px-3 py-3 text-[#50575e]">
                      <p className="line-clamp-3">{p.seoTitle || `${p.name} | Modempic`}</p>
                    </td>
                    <td className="max-w-[220px] px-3 py-3 text-[#50575e]">
                      <p className="line-clamp-3">{p.seoDesc || p.shortDesc}</p>
                    </td>
                  </tr>
                );
              })}
              {!products.length ? (
                <tr>
                  <td colSpan={10} className="px-3 py-12 text-center text-sm text-[#50575e]">
                    No products found.
                  </td>
                </tr>
              ) : null}
            </tbody>
            <tfoot>
              <tr className="border-t border-[#dcdcde] bg-[#f6f7f7] text-[11px] uppercase tracking-wider text-[#50575e]">
                <th className="w-10 px-3 py-2.5 font-medium">
                  <input type="checkbox" aria-label="Select all products" />
                </th>
                <th className="w-14 px-3 py-2.5 font-medium">Image</th>
                <th className="px-3 py-2.5 font-medium">Name</th>
                <th className="px-3 py-2.5 font-medium">SKU</th>
                <th className="px-3 py-2.5 font-medium">Price</th>
                <th className="px-3 py-2.5 font-medium">Categories</th>
                <th className="px-3 py-2.5 font-medium">Date</th>
                <th className="px-3 py-2.5 font-medium">SEO Details</th>
                <th className="px-3 py-2.5 font-medium">SEO Title</th>
                <th className="px-3 py-2.5 font-medium">SEO Desc</th>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
