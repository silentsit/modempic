import { describe, expect, it } from "vitest";
import {
  CHECKOUT_COUNTRIES,
  getCheckoutSubdivisions,
  getPostalLabel,
  getSubdivisionLabel,
  hasSubdivisionSelect,
  isValidCheckoutRegion,
  parseCheckoutRegion,
} from "./checkout-geo";

describe("CHECKOUT_COUNTRIES", () => {
  it("lists every ISO country with the United States first", () => {
    expect(CHECKOUT_COUNTRIES.length).toBeGreaterThanOrEqual(200);
    expect(CHECKOUT_COUNTRIES[0]?.code).toBe("US");
    expect(new Set(CHECKOUT_COUNTRIES.map((c) => c.code)).size).toBe(CHECKOUT_COUNTRIES.length);
  });
});

describe("getCheckoutSubdivisions", () => {
  it("uses US states plus military codes", () => {
    const codes = getCheckoutSubdivisions("US").map((s) => s.code);
    expect(codes).toContain("TX");
    expect(codes).toContain("DC");
    expect(codes).toContain("AE");
  });

  it("uses Canadian provinces and UK nations", () => {
    expect(getCheckoutSubdivisions("CA").some((s) => s.code === "ON")).toBe(true);
    expect(getCheckoutSubdivisions("GB").map((s) => s.code)).toEqual(["ENG", "NIR", "SCT", "WLS"]);
  });

  it("skips a dropdown when the dataset has no real regions", () => {
    expect(hasSubdivisionSelect("SG")).toBe(false);
  });
});

describe("parseCheckoutRegion", () => {
  it("normalizes 2-letter and longer region codes", () => {
    expect(parseCheckoutRegion("us", "tx")).toEqual({ country: "US", state: "TX" });
    expect(parseCheckoutRegion("AU", "NSW")).toEqual({ country: "AU", state: "NSW" });
    expect(parseCheckoutRegion("GB", "Scotland")).toEqual({ country: "GB", state: "SCT" });
  });

  it("rejects unknown countries and required regions", () => {
    expect(parseCheckoutRegion("ZZ", "TX")).toBeNull();
    expect(parseCheckoutRegion("US", "")).toBeNull();
    expect(isValidCheckoutRegion("CA", "Ontario")).toBe(true);
  });
});

describe("labels", () => {
  it("changes region and postal wording by country", () => {
    expect(getSubdivisionLabel("CA")).toBe("Province");
    expect(getSubdivisionLabel("JP")).toBe("Prefecture");
    expect(getPostalLabel("US")).toBe("ZIP code");
    expect(getPostalLabel("GB")).toBe("Postcode");
  });
});
