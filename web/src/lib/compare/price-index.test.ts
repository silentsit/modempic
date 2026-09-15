import { describe, expect, it } from "vitest";
import {
  PRICE_INDEX_CSV_PATH,
  PRICE_INDEX_EDITION,
  formatPriceIndexDate,
  isModafinilCatalogRow,
  priceIndexCsv,
  priceIndexCsvFilename,
  priceIndexTsv,
} from "./price-index";

describe("price index edition", () => {
  it("locks four listings and three pack sizes", () => {
    expect(PRICE_INDEX_EDITION.rows).toHaveLength(4);
    expect(new Set(PRICE_INDEX_EDITION.rows.map((row) => row.slug)).size).toBe(4);
    expect(PRICE_INDEX_EDITION.packSizes).toEqual([30, 60, 90]);
    expect(PRICE_INDEX_CSV_PATH).toBe("/modafinil-price-comparison.csv");
  });

  it("formats the pull date in English", () => {
    expect(formatPriceIndexDate(PRICE_INDEX_EDITION.pulledOn)).toBe("15 September 2026");
    expect(formatPriceIndexDate(PRICE_INDEX_EDITION.nextPull)).toBe("15 December 2026");
  });

  it("renders a citeable CSV and TSV", () => {
    const csv = priceIndexCsv();
    expect(csv).toContain("listing,slug,strength_mg,pack_30_usd,pack_60_usd,pack_90_usd,pulled_on,quarter,currency");
    expect(csv).toContain("buy-modvigil-200-mg");
    expect(csv).toContain("49.00");
    expect(csv).toContain("2026-09-15");
    expect(priceIndexCsvFilename()).toBe("modempic-modafinil-price-index-2026-q3.csv");

    const tsv = priceIndexTsv();
    expect(tsv.split("\n")).toHaveLength(5);
    expect(tsv).toContain("Modvigil 200 mg");
    expect(tsv).toContain("$49.00");
  });

  it("keeps Modafinil rows and drops Pregabalin from the live catalog table", () => {
    expect(isModafinilCatalogRow({ slug: "buy-modalert-200-mg", activeIngredient: "Modafinil" })).toBe(true);
    expect(isModafinilCatalogRow({ slug: "buy-waklert-150-mg", activeIngredient: "Armodafinil" })).toBe(true);
    expect(
      isModafinilCatalogRow({ slug: "buy-lyrica-pregabalin-nervigesic-300-mg", activeIngredient: "Pregabalin" }),
    ).toBe(false);
  });
});
