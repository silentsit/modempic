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
      "Compare skin care catalog items by label details, USD pricing, and product-page documentation before checkout.",
    support:
      "Each listing links to a full product record with images, descriptions, pack pricing, and ordering details. Review label information and shipping notes on the product page before placing an order.",
    faqs: [
      {
        q: "What information is shown on each product page?",
        a: "Product pages show pricing, images, descriptions, label or documentation notes where available, specifications, and checkout options.",
      },
      {
        q: "Is this category medical or treatment guidance?",
        a: "No. Skin care pages are catalog and ordering information only—not medical, clinical, diagnosis, treatment, or dosage guidance.",
      },
      {
        q: "How are orders paid?",
        a: "Checkout uses crypto-first payment routing, with supported assets and provider guidance shown during checkout.",
      },
    ],
    editorialLinks: [
      { href: "/shipping", label: "Shipping & handling", description: "Timelines, tracking, and delivery expectations." },
      { href: "/faq", label: "FAQ", description: "Payments, accounts, and order support." },
    ],
  },
  antiparasitic: {
    intro:
      "Review antiparasitic catalog items through product records that focus on labels, USD pricing, ordering details, and documentation notes.",
    support:
      "This category is catalog information only. Review each product page for label details, specifications, price, and shipping notes before checkout.",
    faqs: [
      {
        q: "Does this category provide treatment advice?",
        a: "No. This page is catalog and ordering information only and does not provide treatment, dosage, diagnosis, or personal-use guidance.",
      },
      {
        q: "What should I review before checkout?",
        a: "Review the product label, description, specifications, price, shipping notes, and payment instructions on the product page.",
      },
      {
        q: "How do I compare products here?",
        a: "Use the compare links above the product grid, then open individual listings to review pack sizes and pricing.",
      },
    ],
    editorialLinks: [
      { href: "/shipping", label: "Shipping & handling", description: "Timelines, tracking, and delivery expectations." },
      { href: "/faq", label: "FAQ", description: "Payments, accounts, and order support." },
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
