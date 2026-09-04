export type ListingItem = {
  name: string;
  url: string;
};

export function buildItemListJsonLd(items: ListingItem[], baseUrl: string) {
  const root = baseUrl.replace(/\/$/, "");
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    numberOfItems: items.length,
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
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
  const root = baseUrl.replace(/\/$/, "");
  const url = `${root}${path.startsWith("/") ? path : `/${path}`}`;
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name,
    ...(description ? { description } : {}),
    url,
    mainEntity: buildItemListJsonLd(items, baseUrl),
  };
}
