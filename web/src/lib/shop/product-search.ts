type SearchableProduct = {
  name: string;
  shortDesc?: string | null;
  longDesc?: string | null;
  categories?: { category: { name: string } }[];
};

export function normalizeShopQuery(query?: string | null) {
  return query?.trim().replace(/\s+/g, " ").slice(0, 80) ?? "";
}

export function productMatchesQuery(product: SearchableProduct, query: string) {
  if (!query) return true;
  const searchable = [
    product.name,
    product.shortDesc,
    product.longDesc,
    ...(product.categories ?? []).map((row) => row.category.name),
  ]
    .join(" ")
    .toLowerCase();
  return searchable.includes(query.toLowerCase());
}
