import type { Metadata } from "next";
import { BuyModafinilRedditLanding } from "@/components/landings/modafinil/buy-modafinil-reddit-landing";
import { buyModafinilRedditCopy } from "@/content/landings/buy-modafinil-reddit";
import { getPublishedProductsBySlugs } from "@/lib/data/products";
import { hydrateModafinilPricingRows } from "@/lib/landings/hydrate-modafinil-pricing";
import { JsonLd } from "@/components/seo/json-ld";
import { DEFAULT_SHARE_IMAGE, pageDocumentTitle, pageShareTitle } from "@/lib/seo/page-metadata";
import { buildWebPageJsonLd } from "@/lib/seo/page-json-ld";
import { getSiteUrl } from "@/lib/site-url";

const copy = buyModafinilRedditCopy;

export const revalidate = 3600;

export const metadata: Metadata = {
  title: pageDocumentTitle(copy.seo.title),
  description: copy.seo.description,
  alternates: { canonical: copy.slug },
  openGraph: {
    title: pageShareTitle(copy.seo.title),
    description: copy.seo.description,
    url: copy.slug,
    type: "website",
    images: [DEFAULT_SHARE_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: pageShareTitle(copy.seo.title),
    description: copy.seo.description,
    images: [DEFAULT_SHARE_IMAGE.url],
  },
};

export default async function BuyModafinilRedditPage() {
  const slugs = copy.pricing.rows.map((row) => row.productSlug);
  const products = await getPublishedProductsBySlugs(slugs);
  const pricingRows = hydrateModafinilPricingRows(copy.pricing.rows, products);
  return (
    <>
      <BuyModafinilRedditLanding copy={copy} pricingRows={pricingRows} />
      <JsonLd
        data={buildWebPageJsonLd({
          name: copy.seo.title,
          description: copy.seo.description,
          path: copy.slug,
          baseUrl: getSiteUrl(),
        })}
      />
    </>
  );
}
