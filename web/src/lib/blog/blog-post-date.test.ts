import { describe, expect, it } from "vitest";
import { getBlogPostCardDate } from "./blog-post-date";

describe("getBlogPostCardDate", () => {
  it("shows updated when content changed after publish", () => {
    const publishedAt = new Date("2025-01-31T02:17:45.000Z");
    const updatedAt = new Date("2026-09-05T12:38:40.261Z");

    expect(getBlogPostCardDate({ publishedAt, updatedAt })).toEqual({
      label: "Updated",
      date: updatedAt,
    });
  });

  it("shows published when updatedAt matches publish time", () => {
    const publishedAt = new Date("2025-01-31T02:17:45.000Z");

    expect(getBlogPostCardDate({ publishedAt, updatedAt: publishedAt })).toEqual({
      label: "Published",
      date: publishedAt,
    });
  });

  it("falls back to updatedAt when publishedAt is missing", () => {
    const updatedAt = new Date("2026-09-05T12:38:40.261Z");

    expect(getBlogPostCardDate({ publishedAt: null, updatedAt })).toEqual({
      label: "Updated",
      date: updatedAt,
    });
  });
});
