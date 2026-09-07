import { describe, expect, it } from "vitest";
import { parseStrengthMgFromName, verifiedAttributesForSlug } from "./product-attributes";

describe("verified product attributes", () => {
  it("only sets manufacturer when a source exists", () => {
    const modalert = verifiedAttributesForSlug("buy-modalert-200-mg");
    expect(modalert?.manufacturer).toBe("Sun Pharmaceutical Industries Ltd");
    expect(modalert?.sources.length).toBeGreaterThan(0);

    const modvigil = verifiedAttributesForSlug("buy-modvigil-200-mg");
    expect(modvigil?.manufacturer).toBeUndefined();
    expect(modvigil?.strengthMg).toBe(200);
  });

  it("parses strength from the catalog name", () => {
    expect(parseStrengthMgFromName("Artvigil 150 Mg")).toBe(150);
    expect(parseStrengthMgFromName("Starter Pack Combo")).toBeNull();
  });
});
