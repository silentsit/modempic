import { describe, expect, it } from "vitest";
import {
  EDITORIAL_TEAM_NAME,
  blogAuthorDisplayName,
  blogAuthorJsonLd,
  isGenericBlogAuthorName,
} from "./editorial-author";

describe("blogAuthorDisplayName", () => {
  it("maps Admin / Modempic Admin to the editorial team", () => {
    expect(blogAuthorDisplayName("Modempic Admin")).toBe(EDITORIAL_TEAM_NAME);
    expect(blogAuthorDisplayName("Admin")).toBe(EDITORIAL_TEAM_NAME);
    expect(blogAuthorDisplayName("modempic")).toBe(EDITORIAL_TEAM_NAME);
    expect(blogAuthorDisplayName(null)).toBe(EDITORIAL_TEAM_NAME);
    expect(blogAuthorDisplayName(EDITORIAL_TEAM_NAME)).toBe(EDITORIAL_TEAM_NAME);
  });

  it("keeps a real person byline", () => {
    expect(isGenericBlogAuthorName("Jordan Chen")).toBe(false);
    expect(blogAuthorDisplayName("Jordan Chen")).toBe("Jordan Chen");
  });
});

describe("blogAuthorJsonLd", () => {
  it("emits Organization markup for the editorial team", () => {
    expect(blogAuthorJsonLd("Modempic Admin", "https://modempic.com/#organization")).toEqual({
      "@id": "https://modempic.com/#organization",
      "@type": "Organization",
      name: EDITORIAL_TEAM_NAME,
    });
    expect(blogAuthorJsonLd(EDITORIAL_TEAM_NAME, "https://modempic.com/#organization")).toEqual({
      "@id": "https://modempic.com/#organization",
      "@type": "Organization",
      name: EDITORIAL_TEAM_NAME,
    });
  });

  it("emits Person markup for a named author", () => {
    expect(blogAuthorJsonLd("Jordan Chen", "https://modempic.com/#organization")).toEqual({
      "@type": "Person",
      name: "Jordan Chen",
    });
  });
});
