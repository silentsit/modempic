import { describe, expect, it } from "vitest";
import { escapeXml, renderSitemapIndex, renderUrlset, staticPageLoc, toAbsoluteUrl, toCompareSitemapUrls } from "./sitemap-xml";

describe("sitemap XML", () => {
  it("renders a Yoast-style sitemap index with stylesheet", () => {
    const xml = renderSitemapIndex(
      [{ loc: "https://modempic.com/page-sitemap.xml", lastmod: new Date("2026-08-21T12:00:00.000Z") }],
      "https://modempic.com/sitemap.xsl",
    );
    expect(xml).toContain('<?xml-stylesheet type="text/xsl" href="https://modempic.com/sitemap.xsl"?>');
    expect(xml).toContain("<sitemapindex");
    expect(xml).toContain("<loc>https://modempic.com/page-sitemap.xml</loc>");
    expect(xml).not.toContain("<urlset");
  });

  it("renders a urlset with image entries and escaped loc", () => {
    const xml = renderUrlset(
      [
        {
          loc: "https://modempic.com/product/buy-modalert-200-mg",
          lastmod: new Date("2026-05-05T10:27:15.163Z"),
          images: [{ loc: "https://res.cloudinary.com/demo/modalert.png", title: "Modalert <200>" }],
        },
      ],
      "https://modempic.com/sitemap.xsl",
    );
    expect(xml).toContain("<urlset");
    expect(xml).toContain("xmlns:image=");
    expect(xml).toContain("<image:loc>https://res.cloudinary.com/demo/modalert.png</image:loc>");
    expect(xml).toContain("<image:title>Modalert &lt;200&gt;</image:title>");
  });

  it("escapes XML and absolutizes relative image paths", () => {
    expect(escapeXml(`a&b<"'>`)).toBe("a&amp;b&lt;&quot;&apos;&gt;");
    expect(toAbsoluteUrl("/blog-media/cover.jpg", "https://modempic.com")).toBe(
      "https://modempic.com/blog-media/cover.jpg",
    );
    expect(toAbsoluteUrl("https://cdn.example/a.png", "https://modempic.com")).toBe("https://cdn.example/a.png");
  });

  it("omits lastmod when the date is unknown instead of stamping now()", () => {
    const index = renderSitemapIndex(
      [{ loc: "https://modempic.com/page-sitemap.xml" }],
      "https://modempic.com/sitemap.xsl",
    );
    expect(index).toContain("<loc>https://modempic.com/page-sitemap.xml</loc>");
    expect(index).not.toContain("<lastmod>");

    const urlset = renderUrlset([{ loc: "https://modempic.com/about" }], "https://modempic.com/sitemap.xsl");
    expect(urlset).toContain("<loc>https://modempic.com/about</loc>");
    expect(urlset).not.toContain("<lastmod>");
  });

  it("matches homepage canonical loc without a trailing slash", () => {
    expect(staticPageLoc("https://modempic.com", "")).toBe("https://modempic.com");
    expect(staticPageLoc("https://modempic.com/", "/shop")).toBe("https://modempic.com/shop");
  });
});

describe("toCompareSitemapUrls", () => {
  it("keeps batch 1 pairs and stamps lastmod from the newer product", () => {
    const urls = toCompareSitemapUrls(
      "https://modempic.com/",
      [
        {
          path: "/compare/modalert-200-mg-vs-waklert-150-mg",
          batch: 1,
          leftSlug: "buy-modalert-200-mg",
          rightSlug: "buy-waklert-150-mg",
        },
        {
          path: "/compare/modaheal-200-mg-vs-vilafinil-200-mg",
          batch: 2,
          leftSlug: "buy-modaheal-200-mg",
          rightSlug: "buy-vilafinil-200-mg",
        },
      ],
      new Map([
        ["buy-modalert-200-mg", new Date("2026-04-01T00:00:00.000Z")],
        ["buy-waklert-150-mg", new Date("2026-08-21T12:00:00.000Z")],
      ]),
    );

    expect(urls).toHaveLength(1);
    expect(urls[0]?.loc).toBe("https://modempic.com/compare/modalert-200-mg-vs-waklert-150-mg");
    expect(urls[0]?.lastmod?.toISOString()).toBe("2026-08-21T12:00:00.000Z");
  });
});
