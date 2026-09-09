import { absolutePageUrl, siteGraphIds } from "@/lib/seo/page-json-ld";

export type ListingItem = {
  name: string;
  url: string;
};

export type ListingItemType = "Product" | "BlogPosting" | "Thing";

export function buildItemListJsonLd(
  items: ListingItem[],
  baseUrl: string,
  itemType: ListingItemType = "Thing",
) {
  const root = baseUrl.replace(/\/$/, "");
  return {
    "@type": "ItemList" as const,
    numberOfItems: items.length,
    itemListElement: items.map((item, index) => {
      const url = item.url.startsWith("http")
        ? item.url
        : `${root}${item.url.startsWith("/") ? item.url : `/${item.url}`}`;
      return {
        "@type": "ListItem" as const,
        position: index + 1,
        item: {
          "@type": itemType,
          name: item.name,
          url,
        },
      };
    }),
  };
}

export function buildCollectionPageJsonLd({
  name,
  description,
  path,
  items,
  baseUrl,
  itemType = "Thing",
}: {
  name: string;
  description?: string;
  path: string;
  items: ListingItem[];
  baseUrl: string;
  itemType?: ListingItemType;
}) {
  const { websiteId, organizationId } = siteGraphIds(baseUrl);
  const url = absolutePageUrl(baseUrl, path);
  return {
    "@context": "https://schema.org" as const,
    "@type": "CollectionPage" as const,
    "@id": url,
    name,
    ...(description ? { description } : {}),
    url,
    inLanguage: "en",
    isPartOf: { "@id": websiteId },
    publisher: { "@id": organizationId },
    mainEntity: buildItemListJsonLd(items, baseUrl, itemType),
  };
}
