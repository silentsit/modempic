import { categorySeoContent } from "@/content/category-clusters";

export type ProductSpecRow = { label: string; value: string };

export type ProductPdpTabContent = {
  specs: ProductSpecRow[];
  shippingNotes: string | null;
  storageNotes: string | null;
  faqs: Array<{ q: string; a: string }>;
};

export function labelFromSpecKey(key: string) {
  return key
    .replace(/[_-]+/g, " ")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function specificationEntries(raw: unknown): ProductSpecRow[] {
  if (!raw || Array.isArray(raw) || typeof raw !== "object") return [];
  return Object.entries(raw as Record<string, unknown>)
    .map(([key, value]) => {
      if (value == null || value === "") return null;
      const display =
        typeof value === "string" || typeof value === "number" || typeof value === "boolean"
          ? String(value)
          : JSON.stringify(value);
      return { label: labelFromSpecKey(key), value: display };
    })
    .filter((row): row is ProductSpecRow => Boolean(row));
}

const DEFAULT_SHIPPING_FAQ = {
  q: "How does shipping work?",
  a: "Shipping method and timing depend on your order total and destination. Review /shipping for general timelines, tracking expectations, and handling notes.",
};

const DEFAULT_ORDERING_FAQ = {
  q: "What should I review before checkout?",
  a: "Confirm pack size, price, label details, and any specifications on this page. Checkout requires an account and shows supported crypto payment options.",
};

export function buildProductPdpTabContent(input: {
  specifications: unknown;
  shippingRestrictions?: string | null;
  storageNotes?: string | null;
  purity?: string | null;
  testingStatus?: string | null;
  primaryCategorySlug?: string | null;
}): ProductPdpTabContent {
  const specs = specificationEntries(input.specifications);
  if (input.purity) specs.unshift({ label: "Purity", value: input.purity });
  if (input.testingStatus) specs.unshift({ label: "Testing status", value: input.testingStatus });

  const categoryFaqs = input.primaryCategorySlug
    ? categorySeoContent(input.primaryCategorySlug, "").faqs.slice(0, 2)
    : [];

  const faqs = [...categoryFaqs, DEFAULT_ORDERING_FAQ, DEFAULT_SHIPPING_FAQ];

  return {
    specs,
    shippingNotes: input.shippingRestrictions?.trim() || null,
    storageNotes: input.storageNotes?.trim() || null,
    faqs,
  };
}
