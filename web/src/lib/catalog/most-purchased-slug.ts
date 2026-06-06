export type PurchaseAggregate = {
  slug: string;
  quantity: number;
  visible: boolean;
};

/** Picks the storefront-visible product with the highest completed-order quantity. */
export function pickMostPurchasedSlug(rows: PurchaseAggregate[]): string | null {
  const eligible = rows.filter((row) => row.visible && row.quantity > 0);
  if (eligible.length === 0) return null;

  const sorted = [...eligible].sort((a, b) => {
    if (b.quantity !== a.quantity) return b.quantity - a.quantity;
    return a.slug.localeCompare(b.slug);
  });

  return sorted[0]?.slug ?? null;
}
