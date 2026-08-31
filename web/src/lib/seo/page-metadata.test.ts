import { describe, expect, it } from "vitest";
import {
  DEFAULT_SHARE_IMAGE,
  pageDocumentTitle,
  pageShareTitle,
  pageSocialMetadata,
  stripBrandTitleSuffix,
} from "./page-metadata";

describe("stripBrandTitleSuffix", () => {
  it("removes a trailing brand pipe so the layout template does not double it", () => {
    expect(stripBrandTitleSuffix("Modafinil | Modempic")).toBe("Modafinil");
    expect(stripBrandTitleSuffix("Buy Artvigil 150 mg | Modempic")).toBe("Buy Artvigil 150 mg");
  });

  it("leaves titles that do not already include the brand", () => {
    expect(stripBrandTitleSuffix("About Modempic")).toBe("About Modempic");
    expect(stripBrandTitleSuffix("Nootropics")).toBe("Nootropics");
  });
});

describe("pageDocumentTitle", () => {
  it("title-cases the stripped title for the document title slot", () => {
    expect(pageDocumentTitle("modafinil | Modempic")).toBe("Modafinil");
  });
});

describe("pageShareTitle", () => {
  it("adds the brand once for social cards", () => {
    expect(pageShareTitle("Modafinil | Modempic")).toBe("Modafinil | Modempic");
    expect(pageShareTitle("Shop")).toBe("Shop | Modempic");
  });
});

describe("pageSocialMetadata", () => {
  it("includes the default 1200×630 share image on Open Graph and Twitter", () => {
    const meta = pageSocialMetadata({
      title: "FAQ",
      description: "Answers to common Modempic questions.",
      path: "/faq",
    });
    expect(meta.openGraph?.images).toEqual([DEFAULT_SHARE_IMAGE]);
    expect(meta.twitter?.images).toEqual([DEFAULT_SHARE_IMAGE.url]);
    expect(DEFAULT_SHARE_IMAGE).toMatchObject({ width: 1200, height: 630, url: "/opengraph-image" });
  });
});
