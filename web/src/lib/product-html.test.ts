import { describe, expect, it } from "vitest";
import {
  productBodyImageUrlIsUsable,
  rewriteProductBodyImageHtml,
  sanitizeProductBodyHtml,
} from "./product-html";

describe("productBodyImageUrlIsUsable", () => {
  it("rejects leftover NooFox and local WordPress hosts", () => {
    expect(productBodyImageUrlIsUsable("https://noofoxxx.local/wp-content/uploads/a.jpg")).toBe(false);
    expect(productBodyImageUrlIsUsable("https://noofox.com/wp-content/uploads/a.jpg")).toBe(false);
    expect(productBodyImageUrlIsUsable("https://stg-noofox-testground.kinsta.cloud/wp-content/a.jpg")).toBe(false);
    expect(productBodyImageUrlIsUsable("https://www.on-page.ai/user-images/a.jpeg")).toBe(false);
  });

  it("keeps Cloudinary and other live hosts", () => {
    expect(productBodyImageUrlIsUsable("https://res.cloudinary.com/demo/image/upload/a.jpg")).toBe(true);
    expect(productBodyImageUrlIsUsable("https://koala.sh/api/image/v2.jpg?width=10&height=10")).toBe(true);
  });
});

describe("rewriteProductBodyImageHtml", () => {
  it("drops a dead srcset so the browser uses a working src", () => {
    const html =
      '<img src="https://res.cloudinary.com/demo/image/upload/a.jpg" srcset="https://noofox.com/wp-content/uploads/a.jpg 1024w" alt="Pack">';
    const out = rewriteProductBodyImageHtml(html);
    expect(out).toContain("res.cloudinary.com");
    expect(out).not.toContain("srcset");
    expect(out).not.toContain("noofox.com");
  });

  it("promotes a usable srcset candidate when src is a dead local host", () => {
    const html =
      '<img src="https://noofoxxx.local/wp-content/uploads/a.jpg" srcset="https://koala.sh/api/image/v2.jpg 1024w" alt="">';
    const out = rewriteProductBodyImageHtml(html);
    expect(out).toContain("koala.sh");
    expect(out).not.toContain("noofoxxx.local");
    expect(out).not.toContain("srcset");
    expect(out).toContain('alt="Product image"');
  });

  it("adds alt from the filename when the tag has none", () => {
    const html = '<img src="https://res.cloudinary.com/demo/image/upload/lyrica-300-mg.png">';
    expect(rewriteProductBodyImageHtml(html)).toContain('alt="Lyrica 300 Mg"');
  });

  it("keeps an existing descriptive alt", () => {
    const html =
      '<img src="https://res.cloudinary.com/demo/image/upload/a.jpg" alt="Nervigesic 300 mg pack">';
    expect(rewriteProductBodyImageHtml(html)).toContain('alt="Nervigesic 300 mg pack"');
  });

  it("removes images that only point at dead hosts", () => {
    const html =
      '<p>x</p><img src="https://noofoxxx.local/wp-content/uploads/a.jpg" srcset="https://noofox.com/wp-content/uploads/a.jpg 1024w" alt="">';
    expect(rewriteProductBodyImageHtml(html)).toBe("<p>x</p>");
  });
});

describe("sanitizeProductBodyHtml", () => {
  it("strips dead body images during sanitization", () => {
    const html = '<p>Hi</p><img src="https://noofox.com/wp-content/uploads/a.jpg" alt="gone">';
    expect(sanitizeProductBodyHtml(html)).toBe("<p>Hi</p>");
  });

  it("keeps heading ids so in-body table of contents anchors still resolve", () => {
    const html =
      '<h2 id="pricing">Price, pack sizes, and value</h2><p>See <a href="#pricing">pricing</a>.</p><h3 id="faq-dose">What is the usual labeled adult dose?</h3>';
    const out = sanitizeProductBodyHtml(html);
    expect(out).toContain('id="pricing"');
    expect(out).toContain('id="faq-dose"');
    expect(out).toContain('href="#pricing"');
  });

  it("does not leave empty rel on internal links", () => {
    const out = sanitizeProductBodyHtml('<p><a href="/shipping" rel="">Shipping</a></p>');
    expect(out).toContain('href="/shipping"');
    expect(out).not.toMatch(/\srel(?:=|>|\s)/);
  });

  it("sets noopener noreferrer on new-tab links", () => {
    const out = sanitizeProductBodyHtml('<a href="https://dailymed.nlm.nih.gov/x" target="_blank">DailyMed</a>');
    expect(out).toContain('rel="noopener noreferrer"');
  });

  it("keeps numbered citation targets and superscript links", () => {
    const html =
      '<p>Label.<sup><a href="#ref-1">[1]</a></sup></p><ol><li id="ref-1">DailyMed</li></ol>';
    const out = sanitizeProductBodyHtml(html);
    expect(out).toContain('href="#ref-1"');
    expect(out).toContain('id="ref-1"');
    expect(out).toContain("<sup>");
  });
});
