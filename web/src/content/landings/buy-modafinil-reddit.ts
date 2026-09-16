/**
 * Copy for /buy-modafinil-reddit.
 * Intent: Google shows sourcing threads for this query; this page is a checkable catalog checkout.
 * Do not emit FAQPage JSON-LD. Do not invent Reddit thread findings or vendor league tables.
 */
import type { LandingLink, LandingPricingRow, LandingSource } from "@/content/landings/where-to-buy-modafinil-online";

const SOURCE_DAILYMED_PROVIGIL: LandingSource = {
  label: "FDA DailyMed — Provigil (Modafinil) prescribing information",
  url: "https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=e16c26ad-7bc2-d155-3a5d-da83ad6492c8",
};

const SOURCE_DEA_SCHEDULE: LandingSource = {
  label: "Federal Register — Placement of Modafinil into Schedule IV (DEA, 1999)",
  url: "https://www.federalregister.gov/documents/1999/01/27/99-1791/schedules-of-controlled-substances-placement-of-modafinil-into-schedule-iv",
};

const SOURCE_MAYO: LandingSource = {
  label: "Mayo Clinic — Modafinil (oral route)",
  url: "https://www.mayoclinic.org/drugs-supplements/modafinil-oral-route/description/drg-20064870",
};

export const BUY_MODAFINIL_REDDIT_SLUG = "/buy-modafinil-reddit";

export type RedditLandingLink = {
  href: string;
  label: string;
};

export type RedditLandingQuestion = {
  q: string;
  a: string;
  sources?: LandingSource[];
  links?: RedditLandingLink[];
};

export type RedditChecklistItem = {
  title: string;
  body: string;
  href: string;
  linkLabel: string;
};

export type BuyModafinilRedditCopy = {
  slug: typeof BUY_MODAFINIL_REDDIT_SLUG;
  seo: { title: string; description: string };
  hero: {
    kicker: string;
    headline: string;
    paragraphs: [string, string];
    primaryCta: LandingLink;
    secondaryCta: LandingLink;
  };
  checklist: {
    heading: string;
    intro: string;
    items: RedditChecklistItem[];
  };
  pricing: {
    heading: string;
    intro: string;
    rows: LandingPricingRow[];
    footnote: string;
  };
  featuredQuestions: [RedditLandingQuestion, RedditLandingQuestion, RedditLandingQuestion];
  moreQuestions: RedditLandingQuestion[];
  reviews: {
    heading: string;
    body: string;
    href: string;
    cta: string;
  };
  disclaimer: string;
  internalLinks: { href: string; label: string; description: string }[];
};

export const buyModafinilRedditCopy: BuyModafinilRedditCopy = {
  slug: BUY_MODAFINIL_REDDIT_SLUG,
  seo: {
    title: "Buy Modafinil Reddit: Checkout, Not a Thread",
    description:
      "Buy Modafinil Reddit is a sourcing search. Inspect Modempic pack prices, hosted checkout, shipping, and on-site reviews — not anonymous vendor comments.",
  },
  hero: {
    kicker: "Catalog checkout",
    headline: "Buy Modafinil Reddit: Checkout, Not a Thread",
    paragraphs: [
      "Buy Modafinil Reddit is what people type when Google is already showing sourcing threads: lost vendor contacts, telehealth vs a catalog, customs holds, and whether a named shop is real. This page is a public Modempic checkout you can inspect — not a quote from an anonymous comment.",
      "Open Modalert 200 mg or Modvigil 200 mg, pick a 30, 60, or 90 pack, and pay on the hosted card or cryptocurrency page. We do not treat Reddit posts as a storefront and we do not rank unnamed vendors. Legal status varies by country; you are the importer of record where import rules apply.",
    ],
    primaryCta: { label: "Shop Modafinil 200 mg", href: "/product/buy-modalert-200-mg" },
    secondaryCta: { label: "Where to buy online", href: "/where-to-buy-modafinil-online" },
  },
  checklist: {
    heading: "How to check any shop, including this one",
    intro:
      "Sourcing threads ask whether a checkout is real. Run this list on Modempic or on any other site before you pay. Each line opens the public page we use for that check.",
    items: [
      {
        title: "Pack prices in public",
        body: "30, 60, and 90 pill totals should sit on the listing before checkout. Ours are on each product page and in the dated price index.",
        href: "/modafinil-price-comparison",
        linkLabel: "Modafinil price comparison",
      },
      {
        title: "A payment page you can open",
        body: "You should reach a hosted card or crypto page from cart, not a DM or a wallet pasted in a comment.",
        href: "/how-to-pay",
        linkLabel: "How to pay",
      },
      {
        title: "Tracking in writing",
        body: "Dispatch, tracking, and country windows should be on a shipping page, not only in a vendor’s reply.",
        href: "/shipping",
        linkLabel: "Shipping",
      },
      {
        title: "Refund and reship URL",
        body: "Customs and lost-parcel rules should be a published policy, not a promise in a thread.",
        href: "/refund-policy",
        linkLabel: "Return and refund policy",
      },
      {
        title: "Reviews on this domain",
        body: "Approved customer reviews for this catalog live on Modempic, on the same records as the product pages.",
        href: "/modempic-reviews",
        linkLabel: "Modempic reviews",
      },
    ],
  },
  pricing: {
    heading: "Live pack prices on this catalog",
    intro:
      "These four listings are the usual 200 mg and 150 mg starting points. Totals come from each product’s live pack tiers — the same numbers checkout uses.",
    rows: [
      {
        productSlug: "buy-modalert-200-mg",
        name: "Modalert",
        strength: "200 mg",
        packs: ["30 pills", "60 pills", "90 pills"],
      },
      {
        productSlug: "buy-modvigil-200-mg",
        name: "Modvigil",
        strength: "200 mg",
        packs: ["30 pills", "60 pills", "90 pills"],
      },
      {
        productSlug: "buy-artvigil-150-mg",
        name: "Artvigil",
        strength: "150 mg",
        packs: ["30 pills", "60 pills", "90 pills"],
      },
      {
        productSlug: "buy-waklert-150-mg",
        name: "Waklert",
        strength: "150 mg",
        packs: ["30 pills", "60 pills", "90 pills"],
      },
    ],
    footnote: "USD prices can change. Confirm the pack total on the product page before you pay.",
  },
  featuredQuestions: [
    {
      q: "I lost my vendor. Where can I order?",
      a: "A sourcing thread can name a shop. It cannot show this catalog’s pack picker or hosted checkout. If you want to order here, open Modalert 200 mg or Modvigil 200 mg, choose a 30, 60, or 90 pack, and pay on the page we host. Guest checkout uses the email you enter.",
      links: [
        { href: "/product/buy-modalert-200-mg", label: "Modalert 200 mg" },
        { href: "/product/buy-modvigil-200-mg", label: "Modvigil 200 mg" },
      ],
    },
    {
      q: "Is this a prescription or telehealth checkout?",
      a: "No. Modempic does not write prescriptions, run telehealth visits, or decide that you are a candidate for treatment. In the United States, Modafinil is a Schedule IV controlled substance and a prescription medicine, not an over-the-counter shelf item. Other countries use their own rules. The legal and prescription FAQs sit on the where-to-buy page.",
      sources: [SOURCE_DAILYMED_PROVIGIL, SOURCE_DEA_SCHEDULE, SOURCE_MAYO],
      links: [
        { href: "/where-to-buy-modafinil-online#faq", label: "Where to buy — legal and prescription FAQ" },
      ],
    },
    {
      q: "What if customs holds the parcel after I order?",
      a: "You are the importer of record. A hold is not overnight delivery and it is not a guarantee that import is lawful where you live. If a parcel does not clear, the published refund and reship rules apply.",
      links: [{ href: "/refund-policy", label: "Return and refund policy" }],
    },
  ],
  moreQuestions: [
    {
      q: "Card or cryptocurrency?",
      a: "Checkout accepts a card or cryptocurrency on the hosted payment page. Guest checkout uses the email you enter.",
      links: [{ href: "/how-to-pay", label: "How to pay" }],
    },
    {
      q: "How long does shipping take?",
      a: "Paid orders ship by tracked express mail with no shipping fee. Country windows, tracking, and customs notes live on Shipping. The full order FAQ is on where to buy.",
      links: [
        { href: "/shipping", label: "Shipping" },
        { href: "/where-to-buy-modafinil-online#faq", label: "Where to buy — shipping FAQ" },
      ],
    },
    {
      q: "Do you verify shops named in Reddit threads?",
      a: "No. Threads in this query’s results name vendors we do not operate and cannot verify from this page, including names such as mod.af and BuyModa. We do not rank them, quote anonymous posts, or call any shop Reddit-approved. Run the checklist above on any checkout, including ours.",
    },
    {
      q: "Do you offer overnight delivery?",
      a: "No. Processing is within 12 hours of payment confirmation, which is not overnight delivery to your door. The overnight and transit answers sit on where to buy.",
      links: [{ href: "/where-to-buy-modafinil-online#faq", label: "Where to buy — overnight FAQ" }],
    },
  ],
  reviews: {
    heading: "Reviews on this storefront, not in a thread",
    body: "Approved customer reviews for Modempic listings — star ratings, comments, and the product they bought — live on Modempic Reviews. That page is the on-domain record. It is not a screenshot from a comment and it is not a vendor roundup.",
    href: "/modempic-reviews",
    cta: "Read Modempic reviews",
  },
  disclaimer:
    "This page is catalog and ordering copy. It is not medical advice, a diagnosis, or a treatment plan. Products are not intended to diagnose, treat, cure, or prevent any disease. Read the product label. If you are pregnant, nursing, or on medication, ask a health professional before use. Legal status and import rules vary by country. We do not quote or endorse anonymous forum vendors.",
  internalLinks: [
    {
      href: "/where-to-buy-modafinil-online",
      label: "Where to buy Modafinil online",
      description: "How to order, label FAQ, and the full shipping FAQ.",
    },
    {
      href: "/modafinil-price-comparison",
      label: "Modafinil price comparison",
      description: "Dated pack index and CSV for the same four listings.",
    },
    {
      href: "/shop/nootropics",
      label: "Nootropics catalog",
      description: "Every published Modafinil and Armodafinil listing.",
    },
    {
      href: "/how-to-pay",
      label: "How to pay",
      description: "Card or cryptocurrency checkout.",
    },
    {
      href: "/shipping",
      label: "Shipping",
      description: "Transit bands, tracking, and customs notes.",
    },
    {
      href: "/modempic-reviews",
      label: "Modempic reviews",
      description: "Approved customer reviews on this storefront.",
    },
  ],
};
