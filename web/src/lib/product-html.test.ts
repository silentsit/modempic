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
});
