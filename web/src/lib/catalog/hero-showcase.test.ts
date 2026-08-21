import { describe, expect, it } from "vitest";
import { HERO_CUTOUTS, HERO_SHOWCASE_SLUGS, pickHeroShowcaseProducts } from "@/lib/catalog/hero-showcase";

function product(slug: string, url: string | null) {
  return { slug, images: url ? [{ url }] : [{ url: null }] };
}

describe("pickHeroShowcaseProducts", () => {
  it("prefers the named slugs in order", () => {
    const picked = pickHeroShowcaseProducts([
      product("buy-modalert-200-mg", "c.jpg"),
      product("other", "d.jpg"),
      product("buy-artvigil-150-mg", "a.jpg"),
      product("buy-vilafinil-200-mg", "b.jpg"),
    ]);
    expect(picked.map((p) => p.slug)).toEqual([
      "buy-artvigil-150-mg",
      "buy-vilafinil-200-mg",
      "buy-modalert-200-mg",
    ]);
  });

  it("skips products without an image and fills from the rest", () => {
    const picked = pickHeroShowcaseProducts([
      product("buy-artvigil-150-mg", null),
      product("buy-vilafinil-200-mg", "b.jpg"),
      product("other-1", "x.jpg"),
      product("other-2", "y.jpg"),
    ]);
    expect(picked.map((p) => p.slug)).toEqual([
      "buy-vilafinil-200-mg",
      "other-1",
      "other-2",
    ]);
  });

  it("returns fewer than three when the catalog is thin", () => {
    expect(pickHeroShowcaseProducts([product("only", "a.jpg")]).map((p) => p.slug)).toEqual(["only"]);
  });

  it("points the hero cluster at local transparent cutouts", () => {
    expect(HERO_CUTOUTS.map((item) => item.slug)).toEqual([...HERO_SHOWCASE_SLUGS]);
    expect(HERO_CUTOUTS.every((item) => item.imageUrl.startsWith("/hero/") && item.imageUrl.endsWith(".png"))).toBe(
      true,
    );
  });
});
