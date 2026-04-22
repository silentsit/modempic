import { describe, it, expect } from "vitest";
import { formatUsd, parseUsdToCents } from "./money";

describe("formatUsd", () => {
  it("formats cents", () => {
    expect(formatUsd(1999)).toMatch(/19/);
  });
});

describe("parseUsdToCents", () => {
  it("parses dollar string", () => {
    expect(parseUsdToCents("$12.50")).toBe(1250);
  });
  it("returns null for bad input", () => {
    expect(parseUsdToCents("abc")).toBeNull();
  });
});
