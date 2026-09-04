import { describe, expect, it } from "vitest";
import {
  absolutePageUrl,
  buildBlogPostingJsonLd,
  buildContactPageJsonLd,
  buildWebPageJsonLd,
  siteGraphIds,
} from "./page-json-ld";

describe("page JSON-LD builders", () => {
  it("omits a trailing slash on the homepage URL", () => {
    expect(absolutePageUrl("https://modempic.com/", "/")).toBe("https://modempic.com");
    expect(siteGraphIds("https://modempic.com/")).toEqual({
      root: "https://modempic.com",
      organizationId: "https://modempic.com/#organization",
      websiteId: "https://modempic.com/#website",
    });
  });

  it("builds a WebPage that belongs to the site graph", () => {
    const page = buildWebPageJsonLd({
      name: "FAQ",
      description: "Order questions.",
      path: "/faq",
      baseUrl: "https://modempic.com",
    });
    expect(page["@type"]).toBe("WebPage");
    expect(page.url).toBe("https://modempic.com/faq");
    expect(page.isPartOf).toEqual({ "@id": "https://modempic.com/#website" });
  });

  it("builds ContactPage markup from the visible support email", () => {
    const page = buildContactPageJsonLd({
      name: "Contact",
      description: "Email support.",
      baseUrl: "https://modempic.com",
    });
    expect(page["@type"]).toBe("ContactPage");
    expect(page.mainEntity.email).toBe("info@modempic.com");
  });

  it("builds BlogPosting with dates and omits image when the page has none", () => {
    const article = buildBlogPostingJsonLd({
      title: "How Payment Works",
      description: "Card is the default.",
      slug: "how-payment-works",
      imageUrl: null,
      datePublished: "2026-04-01T00:00:00.000Z",
      dateModified: "2026-05-01T00:00:00.000Z",
      authorName: "Modempic",
      articleSection: "Ordering",
      baseUrl: "https://modempic.com",
    });
    expect(article["@type"]).toBe("BlogPosting");
    expect(article.image).toBeUndefined();
    expect(article.datePublished).toBe("2026-04-01T00:00:00.000Z");
    expect(article.publisher.name).toBe("Modempic");
  });
});
