export type CategoryEditorialLink = {
  href: string;
  label: string;
  description: string;
};

export type CategorySeoContent = {
  intro: string;
  support: string;
  faqs: Array<{ q: string; a: string }>;
  editorialLinks?: CategoryEditorialLink[];
};

export const CATEGORY_SEO_CONTENT: Record<string, CategorySeoContent> = {
  modafinil: {
    intro:
      "Review Modafinil catalog records with USD pricing, product labels, and checkout details in one place. Compare strengths, pack sizes, and product-page documentation before you order.",
    support:
      "Use this category to compare strengths, package sizes, pricing, and label details across Modafinil listings. Each product page shows pack options, USD pricing, images, and ordering notes. Modempic keeps payment guidance and order tracking close to checkout.",
    faqs: [
      {
        q: "What should I compare before ordering Modafinil?",
        a: "Compare product name and label, strength (mg), pack size, price per pack, compare-at pricing when shown, shipping notes, and any specifications on the product page.",
      },
      {
        q: "How do pack sizes work on product pages?",
        a: "Many Modafinil listings offer multiple pack sizes. Choose a size on the product page to see the matching price, then continue to checkout with your selected option.",
      },
      {
        q: "Are these pages medical or dosage guidance?",
        a: "No. Modafinil category and product pages are catalog and ordering information only. They are not medical, clinical, dosage, diagnosis, or personal-use guidance.",
      },
      {
        q: "How do I pay for an order?",
        a: "Checkout is crypto-first. Supported assets and provider guidance are shown during checkout after you sign in.",
      },
    ],
    editorialLinks: [
      {
        href: "/blog/modafinil-vs-armodafinil",
        label: "Modafinil vs Armodafinil",
        description: "Catalog-oriented comparison of common product labels and naming.",
      },
      {
        href: "/blog/modafinil-and-productivity",
        label: "Modafinil catalog notes",
        description: "Background on how Modafinil products are listed and documented on Modempic.",
      },
      {
        href: "/shop/best-sellers",
        label: "Best sellers",
        description: "Popular catalog items across Modempic.",
      },
      {
        href: "/shipping",
        label: "Shipping & handling",
        description: "Timelines, tracking, and delivery expectations.",
      },
    ],
  },
};

export function categorySeoContent(slug: string, name: string): CategorySeoContent {
  return (
    CATEGORY_SEO_CONTENT[slug] ?? {
      intro: `Browse ${name} catalog items with clear labels, USD pricing, and product-page documentation where available.`,
      support:
        "Use this category page as a starting point, then review each product detail page for label information, documentation notes, pricing, shipping context, and checkout guidance.",
      faqs: [
        {
          q: "What should I review before ordering?",
          a: "Review the product label, description, documentation notes, price, shipping context, and any category notices on the product page.",
        },
        {
          q: "Are these pages medical guidance?",
          a: "No. Modempic category and product pages are catalog and ordering pages only and are not medical, clinical, diagnosis, treatment, or dosage guidance.",
        },
      ],
    }
  );
}

export function categoryEditorialLinks(slug: string): CategoryEditorialLink[] {
  return CATEGORY_SEO_CONTENT[slug]?.editorialLinks ?? [];
}

