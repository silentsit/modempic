import { revalidatePath } from "next/cache";
import { mappedStorefrontSlug } from "@/lib/catalog/storefront-categories";

/** Paths to refresh after catalog or content changes in admin. */
export function revalidateStorefrontForProduct(slug: string, categorySlugs: string[] = []) {
  revalidatePath("/");
  revalidatePath("/shop");
  revalidatePath("/shop/best-sellers");
  revalidatePath("/modafinil-price-comparison");
  revalidatePath("/compare/[pair]", "page");
  revalidatePath("/shipping");
  revalidatePath("/shipping/[country]", "page");
  revalidatePath(`/product/${slug}`);
  for (const categorySlug of categorySlugs) {
    revalidatePath(`/shop/${categorySlug}`);
    const mapped = mappedStorefrontSlug(categorySlug);
    if (mapped) revalidatePath(`/shop/${mapped}`);
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
  revalidatePath("/sitemap");
  revalidatePath("/sitemap.xml");
  revalidatePath("/sitemap_index.xml");
  revalidatePath("/page-sitemap.xml");
  revalidatePath("/product-sitemap.xml");
  revalidatePath("/category-sitemap.xml");
  revalidatePath("/post-sitemap.xml");
  revalidatePath("/compare-sitemap.xml");
  revalidatePath("/shipping-sitemap.xml");
}
