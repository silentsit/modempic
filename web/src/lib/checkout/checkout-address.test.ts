import { describe, expect, it } from "vitest";
import { joinBillLine2, joinFullName } from "./checkout-address";

describe("joinFullName", () => {
  it("joins first and last name with trimming", () => {
    expect(joinFullName(" Jane ", " Doe ")).toBe("Jane Doe");
  });

  it("returns empty string when both parts are blank", () => {
    expect(joinFullName("  ", "")).toBe("");
  });
});

describe("joinBillLine2", () => {
  it("combines company and apartment lines", () => {
    expect(joinBillLine2("Acme Labs", "Suite 4")).toBe("Company: Acme Labs · Suite 4");
  });

  it("returns undefined when both fields are empty", () => {
    expect(joinBillLine2("", "  ")).toBeUndefined();
  });
});
