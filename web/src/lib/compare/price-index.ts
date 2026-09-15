import { formatUsd } from "@/lib/domain/money";

export const PRICE_INDEX_PATH = "/modafinil-price-comparison";
export const PRICE_INDEX_CSV_PATH = "/modafinil-price-comparison.csv";

/** First dated edition. Add a new object when the next quarter is pulled. Do not overwrite. */
export const PRICE_INDEX_EDITION = {
  quarter: "2026 Q3",
  pulledOn: "2026-09-15",
  nextPull: "2026-12-15",
  currency: "USD",
  packSizes: [30, 60, 90] as const,
  rows: [
    {
      slug: "buy-modvigil-200-mg",
      name: "Modvigil 200 mg",
      strengthMg: 200,
      packs: { 30: 4900, 60: 7900, 90: 9900 },
    },
    {
      slug: "buy-artvigil-150-mg",
      name: "Artvigil 150 mg",
      strengthMg: 150,
      packs: { 30: 5000, 60: 8000, 90: 11000 },
    },
    {
      slug: "buy-modalert-200-mg",
      name: "Modalert 200 mg",
      strengthMg: 200,
      packs: { 30: 5900, 60: 9900, 90: 12900 },
    },
    {
      slug: "buy-waklert-150-mg",
      name: "Waklert 150 mg",
      strengthMg: 150,
      packs: { 30: 5900, 60: 9900, 90: 12900 },
    },
  ],
} as const;

export type PriceIndexEdition = typeof PRICE_INDEX_EDITION;
export type PriceIndexRow = (typeof PRICE_INDEX_EDITION.rows)[number];

export function priceIndexCsvFilename(edition: PriceIndexEdition = PRICE_INDEX_EDITION) {
  return `modempic-modafinil-price-index-${edition.quarter.toLowerCase().replace(/\s+/g, "-")}.csv`;
}

export function formatPriceIndexDate(isoDate: string) {
  const [year, month, day] = isoDate.split("-").map(Number);
  if (!year || !month || !day) return isoDate;
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

export function priceIndexTsv(edition: PriceIndexEdition = PRICE_INDEX_EDITION) {
  const header = ["Listing", "Slug", "Strength mg", "30 USD", "60 USD", "90 USD", "Pulled on", "Quarter"];
  const lines = edition.rows.map((row) =>
    [
      row.name,
      row.slug,
      String(row.strengthMg),
      formatUsd(row.packs[30]),
      formatUsd(row.packs[60]),
      formatUsd(row.packs[90]),
      edition.pulledOn,
      edition.quarter,
    ].join("\t"),
  );
  return [header.join("\t"), ...lines].join("\n");
}

function csvCell(value: string) {
  if (/[",\n\r]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

export function isModafinilCatalogRow(product: { slug: string; activeIngredient?: string | null }) {
  const ingredient = product.activeIngredient?.trim().toLowerCase();
  if (ingredient === "modafinil" || ingredient === "armodafinil") return true;
  if (ingredient) return false;
  return !/pregabalin|lyrica|nervigesic/i.test(product.slug);
}

export function priceIndexCsv(edition: PriceIndexEdition = PRICE_INDEX_EDITION) {
  const header = [
    "listing",
    "slug",
    "strength_mg",
    "pack_30_usd",
    "pack_60_usd",
    "pack_90_usd",
    "pulled_on",
    "quarter",
    "currency",
  ];
  const lines = edition.rows.map((row) =>
    [
      csvCell(row.name),
      csvCell(row.slug),
      String(row.strengthMg),
      (row.packs[30] / 100).toFixed(2),
      (row.packs[60] / 100).toFixed(2),
      (row.packs[90] / 100).toFixed(2),
      edition.pulledOn,
      edition.quarter,
      edition.currency,
    ].join(","),
  );
  return [header.join(","), ...lines].join("\r\n");
}
