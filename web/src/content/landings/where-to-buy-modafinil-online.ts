/**
 * Copy for /where-to-buy-modafinil-online.
 * Do not hardcode USD amounts — hydrate packs from Product variants.
 * Do not emit FAQPage JSON-LD when this copy is rendered.
 */

export type LandingLink = {
  label: string;
  href: string;
};

export type LandingSource = {
  label: string;
  url: string;
};

export type LandingBenefit = {
  title: string;
  body: string;
  href?: string;
};

export type LandingPricingRow = {
  productSlug: string;
  name: string;
  strength: string;
  packs: ["30 pills", "50 pills", "100 pills"];
};

export type LandingFaq = {
  q: string;
  a: string;
  sources?: LandingSource[];
};

export type ModafinilLandingCopy = {
  slug: "/where-to-buy-modafinil-online";
  seo: { title: string; description: string };
  hero: {
    headline: string;
    subhead: string;
    primaryCta: LandingLink;
    secondaryCta: LandingLink;
  };
  benefits: [LandingBenefit, LandingBenefit, LandingBenefit];
  pricing: {
    heading: string;
    intro: string;
    rows: LandingPricingRow[];
    footnote: string;
    catalogCta: { label: string; href: "/shop/nootropics" };
  };
  overview: {
    heading: string;
    paragraphs: string[];
    sources: LandingSource[];
  };
  faqs: LandingFaq[];
  trustBadges: { label: string; detail: string }[];
  disclaimer: string;
  internalLinks: { href: string; label: string; description: string }[];
};

const SOURCE_DAILYMED_PROVIGIL: LandingSource = {
  label: "FDA DailyMed — Provigil (modafinil) prescribing information",
  url: "https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=e16c26ad-7bc2-d155-3a5d-da83ad6492c8",
};

const SOURCE_DAILYMED_NUVIGIL: LandingSource = {
  label: "FDA DailyMed — Nuvigil (armodafinil) prescribing information",
  url: "https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=d878aed0-ddbf-8fa1-abf7-d3e480260845",
};

const SOURCE_MEDLINEPLUS: LandingSource = {
  label: "MedlinePlus — Modafinil",
  url: "https://medlineplus.gov/druginfo/meds/a602016.html",
};

const SOURCE_MAYO: LandingSource = {
  label: "Mayo Clinic — Modafinil (oral route)",
  url: "https://www.mayoclinic.org/drugs-supplements/modafinil-oral-route/description/drg-20064870",
};

const SOURCE_DEA_SCHEDULE: LandingSource = {
  label: "Federal Register — Placement of modafinil into Schedule IV (DEA, 1999)",
  url: "https://www.federalregister.gov/documents/1999/01/27/99-1791/schedules-of-controlled-substances-placement-of-modafinil-into-schedule-iv",
};

export const whereToBuyModafinilOnlineCopy: ModafinilLandingCopy = {
  slug: "/where-to-buy-modafinil-online",
  seo: {
    title: "Where to Buy Modafinil Online [2026] - Visa & Mastercard Accepted",
    description:
      "Where to Buy Modafinil online? Compare various brands of Modafinil & Armodafinil, with card or crypto checkout, at the best place to buy Modafinil in 2026!",
  },
  hero: {
    headline: "Where to Buy Modafinil Online — 200 mg Packs, Live USD Prices, Free Worldwide Shipping",
    subhead:
      "Modempic is a web checkout for Modafinil and related catalog brands — not a local pharmacy counter. Pick a 30, 50, or 100 pill pack on the product page, pay by card or crypto, and we ship tracked mail at no extra shipping charge. 200 mg is the strength most shoppers open first; 150 mg Armodafinil listings sit in the same catalog.",
    primaryCta: { label: "Shop Modafinil 200 mg", href: "/product/buy-modalert-200-mg" },
    secondaryCta: { label: "How checkout works", href: "/how-to-pay" },
  },
  benefits: [
    {
      title: "Pack prices you can check before you pay",
      body: "Standard listings use 30, 50, and 100 pill packs. The 50 and 100 rows show a per-pill save against the 30-pack unit price when that pack is cheaper. Totals stay on the product page so they match checkout.",
      href: "/product/buy-modvigil-200-mg",
    },
    {
      title: "100% free shipping on all orders",
      body: "Every paid order ships by express mail with tracking. No shipping fee. Typical delivery is 2–7 business days to the USA, Canada, the UK, and Australia; 2–4 days in South-East Asia; 5–11 days elsewhere. Those are estimates. Customs can add time.",
      href: "/shipping",
    },
    {
      title: "Card or crypto, plain packaging",
      body: "Card is the default (Apple Pay, Google Pay, Visa, Mastercard, Amex). Crypto stays optional. Parcels go out in discreet packaging. Email support aims to reply within 24 hours.",
      href: "/how-to-pay",
    },
  ],
  pricing: {
    heading: "Modafinil cost by pack size",
    intro:
      "Open a product, pick a pack, check out. The table names four listings people compare first. USD totals and per-pill save percentages come from each product’s live pack tiers.",
    rows: [
      {
        productSlug: "buy-modalert-200-mg",
        name: "Modalert",
        strength: "200 mg",
        packs: ["30 pills", "50 pills", "100 pills"],
      },
      {
        productSlug: "buy-modvigil-200-mg",
        name: "Modvigil",
        strength: "200 mg",
        packs: ["30 pills", "50 pills", "100 pills"],
      },
      {
        productSlug: "buy-artvigil-150-mg",
        name: "Artvigil",
        strength: "150 mg",
        packs: ["30 pills", "50 pills", "100 pills"],
      },
      {
        productSlug: "buy-waklert-150-mg",
        name: "Waklert",
        strength: "150 mg",
        packs: ["30 pills", "50 pills", "100 pills"],
      },
    ],
    footnote:
      "USD prices and per-pill save percentages come from the product page at checkout. This table does not list Chemist Warehouse, IndiaMart, or a Sun Pharma wholesale cart — Modempic is a USD web checkout, not those retailers.",
    catalogCta: { label: "Browse the full nootropics catalog", href: "/shop/nootropics" },
  },
  overview: {
    heading: "What Modafinil is — and what the label actually covers",
    paragraphs: [
      "Modafinil is a prescription wakefulness-promoting medicine. In the United States it is sold as Provigil and as generics. The FDA-approved use is to improve wakefulness in adults with excessive sleepiness from narcolepsy, obstructive sleep apnea (OSA), or shift work disorder (SWD). It is not a treatment for the airway blockage in OSA.",
      "The labeled drug class is a wakefulness-promoting agent. The mechanism is not fully known. DailyMed notes wake-promoting actions similar to some stimulants such as amphetamine and methylphenidate, with a pharmacologic profile that is not identical. Peak plasma levels occur about 2–4 hours after a dose. The effective elimination half-life after multiple doses is about 15 hours.",
      "US labeling lists 100 mg and 200 mg tablets. For narcolepsy or OSA, the usual labeled adult dose is 200 mg once in the morning. For SWD, 200 mg about one hour before the work shift. That is label text, not a personal plan. A clinician sets the dose for a named patient.",
      "Catalog names on Modempic include Modalert and Modvigil (200 mg Modafinil listings) plus Artvigil and Waklert (150 mg Armodafinil listings). Provigil is the US reference brand for Modafinil; Nuvigil is the US reference brand for Armodafinil. We do not stock a “Chemist Warehouse” or IndiaMart SKU under those marketplace names.",
    ],
    sources: [SOURCE_DAILYMED_PROVIGIL, SOURCE_MEDLINEPLUS, SOURCE_MAYO, SOURCE_DAILYMED_NUVIGIL],
  },
  faqs: [
    {
      q: "Can you buy Modafinil online from Modempic?",
      a: "Ordering works as a catalog checkout. Open a product such as Modalert 200 mg or Modvigil 200 mg, choose a 30, 50, or 100 pack, and pay on the hosted checkout. Guest checkout uses the email you enter. That is how the storefront works — not a walk-up pharmacy, not medical advice, and not a green light that import is legal where you live.",
    },
    {
      q: "How do I buy Modafinil online here?",
      a: "Pick a listing, confirm the strength and pack on that page, then use Buy now or Add to cart. Card is the default. Crypto is optional. We email tracking after dispatch. Processing is within 12 hours of payment confirmation — that is not overnight delivery to your door.",
    },
    {
      q: "Is it legal to buy Modafinil online? Can you buy it over the counter?",
      a: "Rules differ by country. In the United States, modafinil is a Schedule IV controlled substance and a prescription medicine, not an over-the-counter shelf item. Other countries use their own prescription or import rules. You are the importer of record. Duties, taxes, and whether you may import or keep the product where you live are yours. We do not give legal advice.",
      sources: [SOURCE_DAILYMED_PROVIGIL, SOURCE_DEA_SCHEDULE, SOURCE_MAYO],
    },
    {
      q: "How do I get a Modafinil prescription?",
      a: "From a licensed clinician who can prescribe in your jurisdiction. Modempic does not write prescriptions, diagnose sleep disorders, or decide that you are a candidate for treatment.",
      sources: [SOURCE_MAYO, SOURCE_MEDLINEPLUS],
    },
    {
      q: "What is Modafinil used for?",
      a: "US labeling: improve wakefulness in adults with excessive sleepiness due to narcolepsy, OSA, or shift work disorder. It is not approved as a general productivity or “biohacking” drug. MedlinePlus and Mayo Clinic describe the same labeled uses.",
      sources: [SOURCE_DAILYMED_PROVIGIL, SOURCE_MEDLINEPLUS, SOURCE_MAYO],
    },
    {
      q: "Is Modafinil for ADHD?",
      a: "No. The FDA label states modafinil is not approved for ADHD. Pediatric ADHD trials reported serious rash, including a possible Stevens–Johnson case. Do not treat this page as ADHD guidance.",
      sources: [SOURCE_DAILYMED_PROVIGIL],
    },
    {
      q: "How long does Modafinil take to work, and how long does it last?",
      a: "Peak blood levels are at 2–4 hours. Food can delay that peak by about an hour. After repeated doses, the effective half-life is about 15 hours. How long you feel awake is not a single labeled “lasts X hours” number. Ask a clinician about timing for your situation.",
      sources: [SOURCE_DAILYMED_PROVIGIL],
    },
    {
      q: "How long does Modafinil stay in your system?",
      a: "The labeled effective elimination half-life after multiple doses is about 15 hours. A metabolite, modafinil sulfone, has a much longer half-life (about 40 hours) and can accumulate. That is pharmacokinetics from the label, not a workplace-test guarantee.",
      sources: [SOURCE_DAILYMED_PROVIGIL],
    },
    {
      q: "What are Modafinil side effects? Is it addictive?",
      a: "Common labeled reactions (≥5%) include headache, nausea, nervousness, rhinitis, diarrhea, back pain, anxiety, insomnia, dizziness, and dyspepsia. Serious risks on the label include rash (stop unless it is clearly not drug-related), allergic reactions, psychiatric symptoms, and caution in some heart conditions. The US label lists it as a Schedule IV controlled substance. It can produce stimulant-like psychoactive effects and has abuse potential. Keep it away from people it was not prescribed for.",
      sources: [SOURCE_DAILYMED_PROVIGIL, SOURCE_MEDLINEPLUS],
    },
    {
      q: "Does Modafinil cause weight loss?",
      a: "It is not approved for weight loss. Weight loss is not among the most common labeled adverse reactions. Do not buy it as a diet product.",
      sources: [SOURCE_DAILYMED_PROVIGIL, SOURCE_MEDLINEPLUS],
    },
    {
      q: "Armodafinil vs Modafinil — and is Modafinil like Adderall?",
      a: "Modafinil is a 1:1 mix of R and S enantiomers. Armodafinil (Nuvigil) is the R-enantiomer alone. Both are labeled as wakefulness-promoting agents for the same three adult sleepiness indications in the US; tablet strengths differ. The Modafinil label says the wake-promoting action resembles some stimulants, including amphetamine and methylphenidate, but the profile is not the same as those amines. That is not a claim that Modafinil “is Adderall” or that one is better.",
      sources: [SOURCE_DAILYMED_PROVIGIL, SOURCE_DAILYMED_NUVIGIL],
    },
    {
      q: "Can you take Modafinil and Ritalin at the same time?",
      a: "Do not stack them on your own. The Modafinil label tells prescribers to watch patients with a history of stimulant abuse, and it names methylphenidate among examples. Other medicines can change how Modafinil is handled. A clinician who has your full list should decide, not a product page.",
      sources: [SOURCE_DAILYMED_PROVIGIL],
    },
    {
      q: "Does Modafinil show up on a drug test?",
      a: "The FDA label does not publish a workplace immunoassay panel. Whether a test reports modafinil depends on what that lab ordered. Ask the testing program or a clinician. We cannot tell you what your lab will run.",
      sources: [SOURCE_DAILYMED_PROVIGIL],
    },
    {
      q: "Where do Reddit and forums say to buy Modafinil?",
      a: "Threads name vendors we cannot verify from this page. We do not quote anonymous posts or claim a “Reddit-approved” shop. What we can show is public pack sizes, live checkout prices, and the shipping and refund rules on this site.",
    },
    {
      q: "Do you offer overnight Modafinil delivery?",
      a: "No. Orders process within 12 hours of payment confirmation. Typical delivery is 2–7 business days to the USA, Canada, the UK, and Australia. Tracking can take about three days to appear on global trackers. Weather, volume, holidays, and customs can add time.",
    },
    {
      q: "Do you ship Modafinil to the US, Canada, the UK, and Australia?",
      a: "Yes. Those four sit in the 2–7 business day window. South-East Asia is usually 2–4 days; elsewhere 5–11. We are a USD web checkout with tracked express mail, not a local pharmacy and not Chemist Warehouse. Customs still apply. You are the importer of record.",
    },
  ],
  trustBadges: [
    {
      label: "Free shipping on all orders",
      detail: "Express mail worldwide. No shipping fee on any paid order.",
    },
    {
      label: "Tracked delivery",
      detail: "Tracking number emailed at dispatch. Typical US/CA/UK/AU window: 2–7 business days.",
    },
    {
      label: "Discreet packaging",
      detail: "Plain packaging on every order.",
    },
    {
      label: "Card checkout",
      detail: "Apple Pay, Google Pay, Visa, Mastercard, and Amex on the hosted card page.",
    },
    {
      label: "Crypto optional",
      detail: "Cryptocurrency remains available if you do not want to pay by card.",
    },
    {
      label: "Email support",
      detail: "Write info@modempic.com. We aim to reply within 24 hours.",
    },
  ],
  disclaimer:
    "This page is catalog and ordering copy. It is not medical advice, a diagnosis, or a treatment plan. Products are not intended to diagnose, treat, cure, or prevent any disease. Read the product label. If you are pregnant, nursing, or on medication, ask a health professional before use. Legal status and import rules vary by country.",
  internalLinks: [
    {
      href: "/shop/nootropics",
      label: "Nootropics catalog",
      description: "All Modafinil and Armodafinil listings with pack pickers.",
    },
    {
      href: "/product/buy-modalert-200-mg",
      label: "Modalert 200 mg",
      description: "200 mg pack options and live USD price.",
    },
    {
      href: "/product/buy-modvigil-200-mg",
      label: "Modvigil 200 mg",
      description: "Another 200 mg listing with 30 / 50 / 100 packs.",
    },
    {
      href: "/product/buy-artvigil-150-mg",
      label: "Artvigil 150 mg",
      description: "Armodafinil 150 mg packs.",
    },
    {
      href: "/product/buy-waklert-150-mg",
      label: "Waklert 150 mg",
      description: "Armodafinil 150 mg packs.",
    },
    {
      href: "/shipping",
      label: "Shipping and handling",
      description: "Free shipping, country windows, customs resend after 14 days.",
    },
    {
      href: "/how-to-pay",
      label: "How to pay",
      description: "Card default, Apple Pay, Google Pay, crypto option.",
    },
    {
      href: "/refund-policy",
      label: "Refunds",
      description: "When a reship or refund applies.",
    },
    {
      href: "/faq",
      label: "FAQ",
      description: "Site-wide shipping, payment, and account questions.",
    },
    {
      href: "/contact",
      label: "Contact",
      description: "Order email only. No medical advice by message.",
    },
  ],
};
