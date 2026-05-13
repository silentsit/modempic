import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { ProductForm } from "../product-form";
import { upsertProductAction, updateProductCategoriesAction } from "@/lib/actions/admin";
import { Button } from "@/components/ui/button";
import { ProductArchiveOrDeleteForm } from "../product-archive-or-delete-form";

type Props = { params: Promise<{ id: string }> };

/** Created by Woo order import scripts when a line item could not be matched to a catalog product. */
const WOO_IMPORT_PLACEHOLDER_SLUG = "_woo_import_unmatched";

export default async function EditProductPage({ params }: Props) {
  const { id } = await params;
  const p = await prisma.product.findUnique({
    where: { id },
    include: {
      images: { take: 1 },
      categories: { include: { category: true } },
      _count: { select: { cartLines: true, orderLines: true, reviews: true } },
    },
  });
  if (!p) notFound();
  const catSlugs = p.categories.map((c) => c.category.slug).join(", ");
  const hasReferences = p._count.cartLines > 0 || p._count.orderLines > 0 || p._count.reviews > 0;

  return (
    <div>
      <h1 className="text-2xl font-bold">Edit {p.name}</h1>
      {p.slug === WOO_IMPORT_PLACEHOLDER_SLUG ? (
        <div
          className="mt-4 max-w-3xl rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-100"
          role="note"
        >
          <p className="font-medium">Migration placeholder (not a real SKU)</p>
          <p className="mt-1 text-amber-900/90 dark:text-amber-100/90">
            This product exists so imported WooCommerce order lines that could not be matched to your catalog still
            point at a valid product. Migrated orders reference it, so the admin cannot hard-delete it. Set status to{" "}
            <strong>Draft</strong> or use <strong>Archive</strong> below to hide it from the storefront; that is
            equivalent to removing it for shoppers.
          </p>
        </div>
      ) : null}
      <ProductForm
        action={upsertProductAction}
        product={{
          id: p.id,
          name: p.name,
          slug: p.slug,
          shortDesc: p.shortDesc,
          longDesc: p.longDesc,
          bodyHtml: p.bodyHtml ?? "",
          priceCents: p.priceCents,
          compareAtCents: p.compareAtCents,
          status: p.status,
          isBestSeller: p.isBestSeller,
          imageUrl: p.images[0]?.url ?? "",
          disclaimer: p.disclaimer ?? "",
          variants: p.variants ? JSON.stringify(p.variants, null, 2) : "",
          seoTitle: p.seoTitle ?? "",
          seoDesc: p.seoDesc ?? "",
        }}
      />
      <form action={updateProductCategoriesAction} className="mt-4 max-w-xl space-y-2 rounded-lg border p-4">
        <h2 className="font-medium">Categories</h2>
        <input type="hidden" name="productId" value={p.id} />
        <p className="text-xs text-[var(--muted-foreground)]">Comma-separated slugs, e.g. modafinil,vitamins</p>
        <input
          name="categorySlugs"
          defaultValue={catSlugs}
          className="w-full rounded border border-[var(--border)] bg-[var(--background)] px-2 py-1 text-sm"
        />
        <Button type="submit" size="sm" variant="secondary">
          Update categories
        </Button>
      </form>
      <ProductArchiveOrDeleteForm id={p.id} hasReferences={hasReferences} />
    </div>
  );
}
