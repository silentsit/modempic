import { JsonLd } from "@/components/seo/json-ld";
import { buildProductJsonLd, type ProductJsonLdInput } from "@/lib/seo/product-json-ld";

export function ProductJsonLd({ product, baseUrl }: { product: ProductJsonLdInput; baseUrl: string }) {
  return <JsonLd data={buildProductJsonLd(product, baseUrl)} />;
}
