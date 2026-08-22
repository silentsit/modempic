import { describe, expect, it } from "vitest";
import { titleCaseHeading, titleCaseHeadingHtml } from "./heading-title-case";

describe("titleCaseHeading", () => {
  it("capitalizes content words and leaves articles lowercase", () => {
    expect(titleCaseHeading("What the sermorelin evidence shows")).toBe("What the Sermorelin Evidence Shows");
  });

  it("leaves connecting words lowercase unless first or last", () => {
    expect(titleCaseHeading("Product documentation and handling notes")).toBe(
      "Product Documentation and Handling Notes",
    );
    expect(titleCaseHeading("The payment process")).toBe("The Payment Process");
  });

  it("keeps acronyms and mixed brand casing", () => {
    expect(titleCaseHeading("What is DMT meditation?")).toBe("What Is DMT Meditation?");
    expect(titleCaseHeading("Buy Artvigil 150 mg")).toBe("Buy Artvigil 150 mg");
  });

  it("handles apostrophes and vs", () => {
    expect(titleCaseHeading("Medicine shouldn't be a privilege.")).toBe("Medicine Shouldn't Be a Privilege.");
    expect(titleCaseHeading("Modafinil vs armodafinil")).toBe("Modafinil vs Armodafinil");
  });
});

describe("titleCaseHeadingHtml", () => {
  it("title-cases heading text and leaves body copy alone", () => {
    const html = "<h2>what the sermorelin evidence shows</h2><p>body stays</p>";
    expect(titleCaseHeadingHtml(html)).toBe("<h2>What the Sermorelin Evidence Shows</h2><p>body stays</p>");
  });

  it("keeps articles lowercase when markup splits the heading", () => {
    const html = "<h2>What the <em>sermorelin</em> evidence shows</h2>";
    expect(titleCaseHeadingHtml(html)).toBe("<h2>What the <em>Sermorelin</em> Evidence Shows</h2>");
  });
});
