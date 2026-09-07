/**
 * Hand-written shipping-country pages. Legal status is a publishing blocker:
 * a country is listed here only when a regulator page names the status.
 */

export type CountryLegalSource = {
  label: string;
  url: string;
};

export type ShippingCountryCopy = {
  slug: string;
  countryName: string;
  iso2: string;
  region: "us-ca-uk-au" | "se-asia" | "rest";
  transitLabel: string;
  transitDays: { min: number; max: number };
  trackingNotes: string[];
  legalStatus: string;
  legalSources: CountryLegalSource[];
  paymentNotes: string;
};

const TRANSIT = {
  usCaUkAu: { min: 2, max: 7, label: "2–7 business days" },
  seAsia: { min: 2, max: 4, label: "2–4 business days" },
  rest: { min: 5, max: 11, label: "5–11 business days" },
} as const;

const SOURCE_DAILYMED = {
  label: "FDA DailyMed — Provigil (modafinil) prescribing information",
  url: "https://dailymed.nlm.nih.gov/dailymed/lookup.cfm?setid=0391f182-1958-9fef-a944-53b229ce99e7",
};

const SOURCE_DEA = {
  label: "Federal Register — Placement of modafinil into Schedule IV (DEA, 1999)",
  url: "https://www.federalregister.gov/documents/1999/01/27/99-1791/schedules-of-controlled-substances-placement-of-modafinil-into-schedule-iv",
};

const SOURCE_MHRA = {
  label: "MHRA Drug Safety Update — Modafinil (Provigil): now restricted to narcolepsy",
  url: "https://www.gov.uk/drug-safety-update/modafinil-provigil-now-restricted-to-narcolepsy",
};

const SOURCE_TGA = {
  label: "Therapeutic Goods Administration — Modafinil: why ‘smart drugs’ are not the brightest option",
  url: "https://www.tga.gov.au/news/news-articles/modafinil-why-smart-drugs-are-not-brightest-option",
};

const SOURCE_HEALTH_CANADA = {
  label: "Health Canada Drug and Health Products Portal — Modafinil Tablets",
  url: "https://dhpp.hpfb-dgpsa.ca/dhpp/resource/96989",
};

const SOURCE_HSA = {
  label: "Health Sciences Authority (Singapore) — Alert on modafinil and armodafinil",
  url: "https://www.hsa.gov.sg/announcements/hsa-alert-nine-consumers-hospitalised-modafinil",
};

const SOURCE_MEDSAFE = {
  label: "Medsafe New Zealand data sheet — Modafinil 100 mg tablets (Prescription Medicine)",
  url: "https://www.medsafe.govt.nz/Profs/Datasheet/m/modafiniltab.pdf",
};

const SOURCE_EMA = {
  label: "European Medicines Agency — Referral: medicines containing modafinil",
  url: "https://www.ema.europa.eu/en/medicines/human/referrals/modafinil",
};

export const SHIPPING_COUNTRIES: ShippingCountryCopy[] = [
  {
    slug: "united-states",
    countryName: "the United States",
    iso2: "US",
    region: "us-ca-uk-au",
    transitLabel: TRANSIT.usCaUkAu.label,
    transitDays: { min: TRANSIT.usCaUkAu.min, max: TRANSIT.usCaUkAu.max },
    trackingNotes: [
      "Use the tracking number in the dispatch email with Post Track or 17 Track first.",
      "Typical US transit sits in the 2–7 business day band on the shipping page. Customs can add time.",
    ],
    legalStatus:
      "In the United States, branded Provigil (modafinil) is labeled a human prescription drug on FDA DailyMed. The DEA placed modafinil in Schedule IV in 1999. This page is shipping and catalog information, not a claim that personal import is lawful in every case.",
    legalSources: [SOURCE_DAILYMED, SOURCE_DEA],
    paymentNotes: "Card is the default checkout method (Apple Pay, Google Pay, Visa, Mastercard, Amex). Crypto stays optional.",
  },
  {
    slug: "united-kingdom",
    countryName: "the United Kingdom",
    iso2: "GB",
    region: "us-ca-uk-au",
    transitLabel: TRANSIT.usCaUkAu.label,
    transitDays: { min: TRANSIT.usCaUkAu.min, max: TRANSIT.usCaUkAu.max },
    trackingNotes: [
      "UK deliveries can also be checked on Royal Mail once a UK tracking number is issued.",
      "Typical UK transit sits in the 2–7 business day band. Customs can add time.",
    ],
    legalStatus:
      "The MHRA treats modafinil (Provigil) as a prescription medicine and, after a European review, restricted the UK indication to narcolepsy. This page does not advise buying without a prescription.",
    legalSources: [SOURCE_MHRA],
    paymentNotes: "Card is the default checkout method. Crypto stays optional. Prices stay in USD.",
  },
  {
    slug: "australia",
    countryName: "Australia",
    iso2: "AU",
    region: "us-ca-uk-au",
    transitLabel: TRANSIT.usCaUkAu.label,
    transitDays: { min: TRANSIT.usCaUkAu.min, max: TRANSIT.usCaUkAu.max },
    trackingNotes: [
      "Use Post Track or 17 Track with the number in the dispatch email.",
      "Typical Australian transit sits in the 2–7 business day band. The TGA notes Border Force can hold undeclared or unprescribed imports.",
    ],
    legalStatus:
      "The Therapeutic Goods Administration lists modafinil as a Schedule 4 prescription-only medicine. TGA says overseas import without a prescription from an Australian healthcare professional is illegal. This page is shipping and catalog information only.",
    legalSources: [SOURCE_TGA],
    paymentNotes: "Card is the default checkout method. Crypto stays optional. Prices stay in USD.",
  },
  {
    slug: "canada",
    countryName: "Canada",
    iso2: "CA",
    region: "us-ca-uk-au",
    transitLabel: TRANSIT.usCaUkAu.label,
    transitDays: { min: TRANSIT.usCaUkAu.min, max: TRANSIT.usCaUkAu.max },
    trackingNotes: [
      "Use Post Track or 17 Track with the number in the dispatch email.",
      "Typical Canadian transit sits in the 2–7 business day band. Customs can add time.",
    ],
    legalStatus:
      "Health Canada lists authorized modafinil tablets in the Drug and Health Products Portal. Canadian product monographs mark the drug as prescription (Pr). This page does not interpret personal-import exceptions.",
    legalSources: [SOURCE_HEALTH_CANADA],
    paymentNotes: "Card is the default checkout method. Crypto stays optional. Prices stay in USD.",
  },
  {
    slug: "singapore",
    countryName: "Singapore",
    iso2: "SG",
    region: "se-asia",
    transitLabel: TRANSIT.seAsia.label,
    transitDays: { min: TRANSIT.seAsia.min, max: TRANSIT.seAsia.max },
    trackingNotes: [
      "SG-suffix tracking numbers can be checked on SingPost as well as Post Track or 17 Track.",
      "South-East Asia transit is estimated at 2–4 business days.",
    ],
    legalStatus:
      "The Health Sciences Authority says modafinil and armodafinil are not registered in Singapore and are prescription medicines in countries where they are registered. HSA states that supplying them without HSA authorization is an offence under the Health Products Act. This page is shipping and catalog information only.",
    legalSources: [SOURCE_HSA],
    paymentNotes: "Card is the default checkout method. Crypto stays optional. Prices stay in USD.",
  },
  {
    slug: "new-zealand",
    countryName: "New Zealand",
    iso2: "NZ",
    region: "rest",
    transitLabel: TRANSIT.rest.label,
    transitDays: { min: TRANSIT.rest.min, max: TRANSIT.rest.max },
    trackingNotes: [
      "Use Post Track or 17 Track with the number in the dispatch email.",
      "New Zealand sits in the rest-of-world 5–11 business day band.",
    ],
    legalStatus:
      "The Medsafe data sheet for Modafinil 100 mg tablets lists the medicine schedule as Prescription Medicine. This page does not advise buying without a New Zealand prescription.",
    legalSources: [SOURCE_MEDSAFE],
    paymentNotes: "Card is the default checkout method. Crypto stays optional. Prices stay in USD.",
  },
  {
    slug: "ireland",
    countryName: "Ireland",
    iso2: "IE",
    region: "rest",
    transitLabel: TRANSIT.rest.label,
    transitDays: { min: TRANSIT.rest.min, max: TRANSIT.rest.max },
    trackingNotes: [
      "Use Post Track or 17 Track with the number in the dispatch email.",
      "Ireland sits in the rest-of-world 5–11 business day band.",
    ],
    legalStatus:
      "The European Medicines Agency referral on modafinil-containing medicines restricted the authorised indication to narcolepsy in the EU. Ireland follows that EU medicines framework. This page is shipping and catalog information, not prescribing advice.",
    legalSources: [SOURCE_EMA],
    paymentNotes: "Card is the default checkout method. Crypto stays optional. Prices stay in USD.",
  },
  {
    slug: "germany",
    countryName: "Germany",
    iso2: "DE",
    region: "rest",
    transitLabel: TRANSIT.rest.label,
    transitDays: { min: TRANSIT.rest.min, max: TRANSIT.rest.max },
    trackingNotes: [
      "Use Post Track or 17 Track with the number in the dispatch email.",
      "Germany sits in the rest-of-world 5–11 business day band.",
    ],
    legalStatus:
      "The European Medicines Agency referral on modafinil-containing medicines restricted the authorised indication to narcolepsy in the EU. Germany follows that EU medicines framework. This page is shipping and catalog information, not prescribing advice.",
    legalSources: [SOURCE_EMA],
    paymentNotes: "Card is the default checkout method. Crypto stays optional. Prices stay in USD.",
  },
  {
    slug: "netherlands",
    countryName: "the Netherlands",
    iso2: "NL",
    region: "rest",
    transitLabel: TRANSIT.rest.label,
    transitDays: { min: TRANSIT.rest.min, max: TRANSIT.rest.max },
    trackingNotes: [
      "Use Post Track or 17 Track with the number in the dispatch email.",
      "The Netherlands sits in the rest-of-world 5–11 business day band.",
    ],
    legalStatus:
      "The European Medicines Agency referral on modafinil-containing medicines restricted the authorised indication to narcolepsy in the EU. The Netherlands follows that EU medicines framework. This page is shipping and catalog information, not prescribing advice.",
    legalSources: [SOURCE_EMA],
    paymentNotes: "Card is the default checkout method. Crypto stays optional. Prices stay in USD.",
  },
  {
    slug: "sweden",
    countryName: "Sweden",
    iso2: "SE",
    region: "rest",
    transitLabel: TRANSIT.rest.label,
    transitDays: { min: TRANSIT.rest.min, max: TRANSIT.rest.max },
    trackingNotes: [
      "Use Post Track or 17 Track with the number in the dispatch email.",
      "Sweden sits in the rest-of-world 5–11 business day band. CH-suffix parcels can also be checked on Swiss Post when that carrier is used.",
    ],
    legalStatus:
      "The European Medicines Agency referral on modafinil-containing medicines restricted the authorised indication to narcolepsy in the EU. Sweden follows that EU medicines framework. This page is shipping and catalog information, not prescribing advice.",
    legalSources: [SOURCE_EMA],
    paymentNotes: "Card is the default checkout method. Crypto stays optional. Prices stay in USD.",
  },
];

export function shippingCountryBySlug(slug: string): ShippingCountryCopy | undefined {
  return SHIPPING_COUNTRIES.find((country) => country.slug === slug);
}

export function shippingCountryPath(slug: string): string {
  return `/shipping/${slug}`;
}

export function shippingCountryTitle(country: ShippingCountryCopy): string {
  return `Modafinil shipping to ${country.countryName}`;
}
