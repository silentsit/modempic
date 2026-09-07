import { describe, expect, it } from "vitest";
import { indexNowPathsForBlog, indexNowPathsForProduct } from "./indexnow-on-publish";

describe("indexNowPathsForProduct", () => {
  it("includes product, shop listings, and category pages", () => {
    expect(indexNowPathsForProduct("modalert-200", ["nootropics"])).toEqual([
      "/",
      "/shop",
      "/shop/best-sellers",
      "/modafinil-price-comparison",
      "/product/modalert-200",
      "/shop/nootropics",
    ]);
  });
});

describe("indexNowPathsForBlog", () => {
  it("includes blog index and post path", () => {
    expect(indexNowPathsForBlog("my-post")).toEqual(["/blog", "/blog/my-post"]);
  });

  it("includes previous slug when the slug changed", () => {
    expect(indexNowPathsForBlog("new-slug", "old-slug")).toEqual([
      "/blog",
      "/blog/new-slug",
      "/blog/old-slug",
    ]);
  });
});
