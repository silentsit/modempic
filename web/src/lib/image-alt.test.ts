import { describe, expect, it } from "vitest";
import { altFromImageSrc, resolvedImageAlt } from "./image-alt";

describe("altFromImageSrc", () => {
  it("humanizes a descriptive filename", () => {
    expect(altFromImageSrc("https://res.cloudinary.com/demo/image/upload/lyrica-300-mg.png")).toBe(
      "Lyrica 300 Mg",
    );
  });

  it("falls back for opaque Cloudinary ids", () => {
    expect(altFromImageSrc("https://koala.sh/api/image/v2.jpg")).toBe("Product image");
    expect(altFromImageSrc("https://res.cloudinary.com/demo/image/upload/abcdef0123456789.jpg")).toBe(
      "Product image",
    );
  });

  it("falls back for data URLs and missing src", () => {
    expect(altFromImageSrc("data:image/png;base64,aaa")).toBe("Product image");
    expect(altFromImageSrc(null)).toBe("Product image");
  });
});

describe("resolvedImageAlt", () => {
  it("keeps a supplied alt", () => {
    expect(resolvedImageAlt("Pack photo", "/x.jpg")).toBe("Pack photo");
  });

  it("fills empty alt from the filename", () => {
    expect(resolvedImageAlt("  ", "/blog-media/modafinil-pack.jpg", "Article image")).toBe(
      "Modafinil Pack",
    );
  });
});
