import { revalidatePath } from "next/cache";

/** Paths to refresh after catalog or content changes in admin. */
export function revalidateStorefrontForProduct(slug: string, categorySlugs: string[] = []) {
  revalidatePath("/");
  revalidatePath("/shop");
  revalidatePath("/shop/best-sellers");
  revalidatePath(`/product/${slug}`);
  for (const categorySlug of categorySlugs) {
    revalidatePath(`/shop/${categorySlug}`);
  }
  revalidatePath("/sitemap.xml");
}

export function revalidateStorefrontForBlog(slug: string) {
  revalidatePath("/blog");
  revalidatePath(`/blog/${slug}`);
  revalidatePath("/sitemap.xml");
}

export function revalidateStorefrontForCategory(categorySlug: string) {
  revalidatePath("/shop");
  revalidatePath(`/shop/${categorySlug}`);
  revalidatePath("/sitemap.xml");
}
