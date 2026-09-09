import { describe, expect, it } from "vitest";
import { isIndexableBlogSlug, NOINDEX_BLOG_SLUGS } from "./storefront-indexable";

describe("storefront-indexable blog slugs", () => {
  it("keeps catalog posts indexable and marks off-topic meditation posts as noindex", () => {
    expect(isIndexableBlogSlug("modafinil-vs-armodafinil")).toBe(true);
    expect(NOINDEX_BLOG_SLUGS).toHaveLength(3);
    for (const slug of NOINDEX_BLOG_SLUGS) {
      expect(isIndexableBlogSlug(slug)).toBe(false);
    }
  });
});
