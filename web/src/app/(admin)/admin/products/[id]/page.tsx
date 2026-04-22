import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { ProductForm } from "../product-form";
import { upsertProductAction, updateProductCategoriesAction } from "@/lib/actions/admin";
import { Button } from "@/components/ui/button";

type Props = { params: Promise<{ id: string }> };

export default async function EditProductPage({ params }: Props) {
  const { id } = await params;
  const p = await prisma.product.findUnique({
    where: { id },
    include: { images: { take: 1 }, categories: { include: { category: true } } },
  });
  if (!p) notFound();
  const catSlugs = p.categories.map((c) => c.category.slug).join(", ");

  return (
    <div>
      <h1 className="text-2xl font-bold">Edit {p.name}</h1>
      <ProductForm
        action={upsertProductAction}
        product={{
          id: p.id,
          name: p.name,
          slug: p.slug,
          shortDesc: p.shortDesc,
          longDesc: p.longDesc,
          priceCents: p.priceCents,
          status: p.status,
          isBestSeller: p.isBestSeller,
          imageUrl: p.images[0]?.url ?? "",
          disclaimer: p.disclaimer ?? "",
        }}
      />
      <form action={updateProductCategoriesAction} className="mt-4 max-w-xl space-y-2 rounded-lg border p-4">
        <h2 className="font-medium">Categories</h2>
        <input type="hidden" name="productId" value={p.id} />
        <p className="text-xs text-[var(--muted-foreground)]">Comma-separated slugs, e.g. vitamins,herbs</p>
        <input
          name="categorySlugs"
          defaultValue={catSlugs}
          className="w-full rounded border border-[var(--border)] bg-[var(--background)] px-2 py-1 text-sm"
        />
        <Button type="submit" size="sm" variant="secondary">
          Update categories
        </Button>
      </form>
    </div>
  );
}
