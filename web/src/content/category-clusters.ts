export type CategorySeoContent = {
  intro: string;
  support: string;
  faqs: Array<{ q: string; a: string }>;
};

export const CATEGORY_SEO_CONTENT: Record<string, CategorySeoContent> = {
  modafinil: {
    intro:
      "Review Modafinil catalog records with USD pricing, product labels, and checkout details in one place. Product pages include ordering information and documentation notes where available.",
    support:
      "Use this category to compare strengths, package sizes, pricing, and product-page documentation before choosing an item. Modempic keeps payment guidance and order tracking close to checkout so the ordering flow is easier to review.",
    faqs: [
      {
        q: "What should I compare before ordering from this category?",
        a: "Compare product labels, package size, price, availability, shipping notes, and any documentation shown on the product page.",
      },
      {
        q: "Are category pages medical guidance?",
        a: "No. Category pages are catalog and ordering pages only. They are not medical, clinical, dosage, diagnosis, or personal-use guidance.",
      },
    ],
  },
  peptides: {
    intro:
      "Browse peptide catalog items with research-use notices, structured handling details, and product documentation where available.",
    support:
      "Peptide listings should be reviewed through their individual product records, including purity/testing status, COA links, storage notes, and shipping restrictions when those fields are provided.",
    faqs: [
      {
        q: "Are peptide products for human consumption?",
        a: "No. Products marked for research use are for laboratory/research purposes only and are not for human consumption, clinical use, diagnosis, treatment, or personal use.",
      },
      {
        q: "Where can I find testing or COA information?",
        a: "When available, testing status and COA links are shown on the product detail page in the research-use details section.",
      },
    ],
  },
  "skin-care": {
    intro:
      "Compare skin care catalog items by label details, pricing, and product-page documentation before checkout.",
    support:
      "Each listing links to a product record with description, images, price, and ordering details. Review the product page for any handling, label, or shipping notes before placing an order.",
    faqs: [
      {
        q: "What information is shown on each product page?",
        a: "Product pages show pricing, images, descriptions, labels or documentation where available, checkout options, and any category-specific notices.",
      },
      {
        q: "How are orders paid?",
        a: "Checkout uses crypto-first payment routing, with supported assets and provider guidance shown during checkout.",
      },
    ],
  },
  antiparasitic: {
    intro:
      "Review antiparasitic catalog items through product records that focus on labels, pricing, ordering details, and documentation notes.",
    support:
      "This category is maintained as catalog information only. Review each item page carefully and do not treat category descriptions as clinical, diagnostic, treatment, or dosage guidance.",
    faqs: [
      {
        q: "Does this category provide treatment advice?",
        a: "No. This page is catalog and ordering information only and does not provide treatment, dosage, diagnosis, or personal-use guidance.",
      },
      {
        q: "What should I review before checkout?",
        a: "Review the product label, description, research-use or category notices, price, shipping notes, and payment instructions.",
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
          a: "Review the product label, description, documentation notes, price, shipping context, and any research-use or category notices on the product page.",
        },
        {
          q: "Are these pages medical guidance?",
          a: "No. Modempic category and product pages are catalog and ordering pages only and are not medical, clinical, diagnosis, treatment, or dosage guidance.",
        },
      ],
    }
  );
}

export const RESEARCH_CLUSTER_LINKS = [
  {
    href: "/research/storage",
    label: "Peptide storage guide",
    description: "Handling, temperature, and reconstitution basics for research materials.",
  },
  {
    href: "/research/testing-coa",
    label: "Testing & COA explainer",
    description: "How to read testing status and certificate-of-analysis links on product pages.",
  },
  { href: "/shipping", label: "Shipping & handling", description: "Timelines, tracking, and delivery expectations." },
  { href: "/faq", label: "FAQ", description: "Payments, accounts, returns, and research-use notices." },
] as const;
