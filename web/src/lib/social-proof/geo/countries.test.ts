import { describe, expect, it } from "vitest";
import {
  ALL_COUNTRIES,
  formatCountryStateLine,
  pickRandomRotationLocation,
  resolveCountry,
  resolveStateAbbreviation,
  ROTATION_COUNTRIES,
  ROTATION_COUNTRY_CODES,
} from "./countries";

describe("ISO country dataset", () => {
  it("loads every country from the downloaded ISO 3166-2 list", () => {
    expect(ALL_COUNTRIES.length).toBeGreaterThanOrEqual(200);
    expect(ALL_COUNTRIES.every((c) => c.states.length > 0)).toBe(true);
  });

  it("rotates 50 countries, each with at least one state", () => {
    expect(ROTATION_COUNTRY_CODES).toHaveLength(50);
    expect(ROTATION_COUNTRIES).toHaveLength(50);
    expect(new Set(ROTATION_COUNTRIES.map((c) => c.code)).size).toBe(50);
    for (const country of ROTATION_COUNTRIES) {
      expect(country.states.length).toBeGreaterThan(0);
    }
  });
});

describe("formatCountryStateLine", () => {
  it("uses country name plus the matching state abbreviation", () => {
    expect(formatCountryStateLine("US", "CO")).toBe("United States, CO");
    expect(formatCountryStateLine("United States", "Texas")).toBe("United States, TX");
    expect(formatCountryStateLine("GB", "ENG")).toBe("United Kingdom, ENG");
    expect(formatCountryStateLine("KR", "11")).toBe("South Korea, 11");
  });

  it("does not invent a state from another country", () => {
    expect(formatCountryStateLine("Japan", "TX")).toBe("Japan");
    expect(resolveStateAbbreviation(resolveCountry("JP")!, "TX")).toBeNull();
  });
});

describe("pickRandomRotationLocation", () => {
  it("always pairs a rotation country with one of its own state abbreviations", () => {
    for (let i = 0; i < 40; i++) {
      const loc = pickRandomRotationLocation();
      const country = ROTATION_COUNTRIES.find((c) => c.name === loc.countryName);
      expect(country).toBeDefined();
      expect(country!.states.some((s) => s.code === loc.stateCode)).toBe(true);
      expect(loc.locationLine).toBe(`${loc.countryName}, ${loc.stateCode}`);
    }
  });
});
