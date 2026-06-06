import { describe, expect, it } from "vitest";
import { ProductStatus } from "@prisma/client";
import { productPublishChecklist, validateProductPublishReadiness } from "./product-publish-readiness";

describe("validateProductPublishReadiness", () => {
  it("allows draft products without publish fields", () => {
    expect(
      validateProductPublishReadiness({
        status: ProductStatus.DRAFT,
        categorySlugs: [],
      }),
    ).toBeNull();
  });

  it("requires catalog publish fields when status is published", () => {
    const msg = validateProductPublishReadiness({
      status: ProductStatus.PUBLISHED,
      categorySlugs: ["modafinil"],
      featuredImageUrl: "https://cdn.example.com/a.jpg",
      featuredImageAlt: "Modafinil pack",
      seoTitle: "Buy Modafinil",
      seoDesc: "Catalog listing",
      productType: "simple",
      tierCount: 1,
    });
    expect(msg).toBeNull();
  });

  it("requires peptide disclaimer only for peptide category", () => {
    const items = productPublishChecklist({
      status: ProductStatus.PUBLISHED,
      categorySlugs: ["peptides"],
      featuredImageUrl: "https://cdn.example.com/a.jpg",
      featuredImageAlt: "Peptide vial",
      seoTitle: "Peptide",
      seoDesc: "Research listing",
      disclaimer: "",
      productType: "simple",
      tierCount: 1,
    });
    const disclaimer = items.find((i) => i.id === "disclaimer");
    expect(disclaimer?.required).toBe(true);
    expect(disclaimer?.ok).toBe(false);
  });
});
