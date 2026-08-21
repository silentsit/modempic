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
  revalidateSitemap();
}

export function revalidateStorefrontForBlog(slug: string) {
  revalidatePath("/blog");
  revalidatePath(`/blog/${slug}`);
  revalidateSitemap();
}

export function revalidateStorefrontForCategory(categorySlug: string) {
  revalidatePath("/shop");
  revalidatePath(`/shop/${categorySlug}`);
  revalidateSitemap();
}

function revalidateSitemap() {
  revalidatePath("/sitemap.xml");
  revalidatePath("/sitemap_index.xml");
  revalidatePath("/page-sitemap.xml");
  revalidatePath("/product-sitemap.xml");
  revalidatePath("/category-sitemap.xml");
  revalidatePath("/post-sitemap.xml");
}
