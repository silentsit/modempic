import { describe, expect, it } from "vitest";
import { escapeXml, renderSitemapIndex, renderUrlset, toAbsoluteUrl } from "./sitemap-xml";

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
});
