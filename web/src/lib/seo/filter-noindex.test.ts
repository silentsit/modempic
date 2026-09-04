import { describe, expect, it } from "vitest";
import { hasMeaningfulSearchParam } from "./filter-noindex";

describe("hasMeaningfulSearchParam", () => {
  it("ignores missing and blank values", () => {
    expect(hasMeaningfulSearchParam(null)).toBe(false);
    expect(hasMeaningfulSearchParam("")).toBe(false);
    expect(hasMeaningfulSearchParam("   ")).toBe(false);
  });

  it("keeps real filter values", () => {
    expect(hasMeaningfulSearchParam("modafinil")).toBe(true);
    expect(hasMeaningfulSearchParam(" Shipping ")).toBe(true);
  });
});
