import { describe, expect, it } from "vitest";
import { groupProductsByCategory } from "./html-sitemap-groups";

describe("groupProductsByCategory", () => {
  it("groups products under each matching category and leftover under Other", () => {
    const groups = groupProductsByCategory(
      [
        { name: "Modafinil", slug: "modafinil" },
        { name: "Tretinoin", slug: "tretinoin" },
      ],
      [
        {
          name: "Modalert 200 mg",
          slug: "buy-modalert-200-mg",
          categories: [{ category: { slug: "modafinil" } }],
        },
        {
          name: "Artvigil 150 mg",
          slug: "buy-artvigil-150-mg",
          categories: [{ category: { slug: "modafinil" } }],
        },
        {
          name: "Standalone item",
          slug: "standalone-item",
          categories: [],
        },
      ],
    );

    expect(groups).toEqual([
      {
        name: "Modafinil",
        href: "/shop/modafinil",
        products: [
          { href: "/product/buy-artvigil-150-mg", label: "Artvigil 150 mg" },
          { href: "/product/buy-modalert-200-mg", label: "Modalert 200 mg" },
        ],
      },
      {
        name: "Other",
        href: "/shop",
        products: [{ href: "/product/standalone-item", label: "Standalone item" }],
      },
    ]);
  });

  it("omits empty categories", () => {
    const groups = groupProductsByCategory(
      [{ name: "Tretinoin", slug: "tretinoin" }],
      [
        {
          name: "Modalert 200 mg",
          slug: "buy-modalert-200-mg",
          categories: [{ category: { slug: "modafinil" } }],
        },
      ],
    );
    expect(groups.map((group) => group.name)).toEqual(["Other"]);
  });
});
