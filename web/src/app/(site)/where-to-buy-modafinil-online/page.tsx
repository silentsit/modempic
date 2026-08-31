import type { Metadata } from "next";
import { ModafinilLanding } from "@/components/landings/modafinil/modafinil-landing";
import { whereToBuyModafinilOnlineCopy } from "@/content/landings/where-to-buy-modafinil-online";
import { getPublishedProductsBySlugs } from "@/lib/data/products";
import { hydrateModafinilPricingRows } from "@/lib/landings/hydrate-modafinil-pricing";
import { DEFAULT_SHARE_IMAGE } from "@/lib/seo/page-metadata";
import { getSiteUrl } from "@/lib/site-url";

const copy = whereToBuyModafinilOnlineCopy;

export const revalidate = 3600;

export const metadata: Metadata = {
  title: { absolute: copy.seo.title },
  description: copy.seo.description,
  alternates: { canonical: copy.slug },
  openGraph: {
    title: copy.seo.title,
    description: copy.seo.description,
    url: copy.slug,
    type: "website",
    images: [DEFAULT_SHARE_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: copy.seo.title,
    description: copy.seo.description,
    images: [DEFAULT_SHARE_IMAGE.url],
  },
};

export default async function WhereToBuyModafinilOnlinePage() {
  const slugs = copy.pricing.rows.map((row) => row.productSlug);
  const products = await getPublishedProductsBySlugs(slugs);
  const pricingRows = hydrateModafinilPricingRows(copy.pricing.rows, products);
  const root = getSiteUrl().replace(/\/$/, "");

  const pageLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${root}${copy.slug}`,
    url: `${root}${copy.slug}`,
    name: copy.seo.title,
    description: copy.seo.description,
    isPartOf: { "@type": "WebSite", name: "Modempic", url: `${root}/` },
  };

  return (
    <>
      <ModafinilLanding copy={copy} pricingRows={pricingRows} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(pageLd) }} />
    </>
  );
}
