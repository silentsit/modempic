import type { Metadata } from "next";
import Link from "next/link";
import { getMostPurchasedProductSlug } from "@/lib/data/most-purchased-product";
import { getPublishedProducts, listCategories } from "@/lib/data/products";
import { ShopCategoryIntroLinks } from "@/lib/shop-category-links";
import { ProductCard } from "@/components/shop/product-card";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { Container } from "@/components/site/container";
import { prismaToStoreProduct } from "@/lib/catalog/prisma-to-store-product";
import { DEFAULT_SHARE_IMAGE } from "@/lib/seo/page-metadata";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Best sellers",
  description: "Most-purchased Modempic catalog items with clear labels and USD pricing.",
  alternates: { canonical: "/shop/best-sellers" },
  openGraph: {
    title: "Best sellers | Modempic",
    description: "Most-purchased Modempic catalog items with clear labels and USD pricing.",
    url: "/shop/best-sellers",
    type: "website",
    images: [DEFAULT_SHARE_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: "Best sellers | Modempic",
    description: "Most-purchased Modempic catalog items with clear labels and USD pricing.",
    images: [DEFAULT_SHARE_IMAGE.url],
  },
};

export default async function BestSellersPage() {
  const [products, categories, mostPurchasedSlug] = await Promise.all([
    getPublishedProducts({ bestSellersOnly: true }),
    listCategories(),
    getMostPurchasedProductSlug(),
  ]);

  return (
    <Container className="py-10 sm:py-14">
      <Breadcrumbs
        crumbs={[
          { label: "Home", href: "/" },
          { label: "Shop", href: "/shop" },
          { label: "Best sellers" },
        ]}
      />
      <h1 className="mt-6 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">Best Sellers</h1>
      <p className="mt-3 max-w-2xl leading-relaxed text-muted-foreground">
        Popular catalog items with the same clear labels and fair pricing. See all{" "}
        <Link href="/shop" className="font-medium text-accent underline-offset-2 transition-colors hover:text-accent-hover hover:underline">products</Link>{" "}
        or browse <ShopCategoryIntroLinks categories={categories} />.
      </p>
      <ul className="mt-12 grid list-none grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {products.map((p, index) => {
          const storeProduct = prismaToStoreProduct(p);
          return (
            <li key={storeProduct.id} className="h-full list-none">
              <ProductCard
                product={storeProduct}
                buyNowHref={`/checkout?buy=${encodeURIComponent(storeProduct.handle)}`}
                mostPurchasedSlug={mostPurchasedSlug}
                priority={index === 0}
              />
            </li>
          );
        })}
      </ul>
    </Container>
  );
}
