import { describe, expect, it } from "vitest";
import { pageDocumentTitle, pageShareTitle, stripBrandTitleSuffix } from "./page-metadata";

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
