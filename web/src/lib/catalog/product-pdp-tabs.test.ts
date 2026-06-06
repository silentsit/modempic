import { describe, expect, it } from "vitest";
import { buildProductPdpTabContent, specificationEntries } from "./product-pdp-tabs";

describe("buildProductPdpTabContent", () => {
  it("includes structured specifications and category FAQs for modafinil", () => {
    const content = buildProductPdpTabContent({
      specifications: { strength: "200 mg", form: "Tablet" },
      shippingRestrictions: "Ships from US warehouse.",
      primaryCategorySlug: "modafinil",
    });
    expect(content.specs).toEqual(
      expect.arrayContaining([
        { label: "Strength", value: "200 mg" },
        { label: "Form", value: "Tablet" },
      ]),
    );
    expect(content.shippingNotes).toContain("US warehouse");
    expect(content.faqs.length).toBeGreaterThan(2);
  });
});

describe("specificationEntries", () => {
  it("returns empty array for invalid input", () => {
    expect(specificationEntries(null)).toEqual([]);
  });
});
