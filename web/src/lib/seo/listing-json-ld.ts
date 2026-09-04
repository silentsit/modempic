import { absolutePageUrl, siteGraphIds } from "@/lib/seo/page-json-ld";

export type ListingItem = {
  name: string;
  url: string;
};

export function buildItemListJsonLd(items: ListingItem[], baseUrl: string) {
  const root = baseUrl.replace(/\/$/, "");
  return {
    "@type": "ItemList" as const,
    numberOfItems: items.length,
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem" as const,
      position: index + 1,
      name: item.name,
      url: item.url.startsWith("http") ? item.url : `${root}${item.url.startsWith("/") ? item.url : `/${item.url}`}`,
    })),
  };
}

export function buildCollectionPageJsonLd({
  name,
  description,
  path,
  items,
  baseUrl,
}: {
  name: string;
  description?: string;
  path: string;
  items: ListingItem[];
  baseUrl: string;
}) {
  const { websiteId } = siteGraphIds(baseUrl);
  const url = absolutePageUrl(baseUrl, path);
  return {
    "@context": "https://schema.org" as const,
    "@type": "CollectionPage" as const,
    "@id": url,
    name,
    ...(description ? { description } : {}),
    url,
    isPartOf: { "@id": websiteId },
    mainEntity: buildItemListJsonLd(items, baseUrl),
  };
}
