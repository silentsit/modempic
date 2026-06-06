import { buildProductJsonLd, type ProductJsonLdInput } from "@/lib/seo/product-json-ld";

export function ProductJsonLd({ product, baseUrl }: { product: ProductJsonLdInput; baseUrl: string }) {
  const productLd = buildProductJsonLd(product, baseUrl);
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productLd) }} />;
}
