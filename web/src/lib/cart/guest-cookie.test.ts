import { describe, expect, it } from "vitest";
import { appendGuestOrderNumber, isGuestCartKey, parseGuestOrderNumbers } from "./guest-cookie";

describe("guest cart cookies", () => {
  it("accepts uuid guest keys", () => {
    expect(isGuestCartKey("2c9e1f6a-3b44-4d2e-9d11-8a0b6c4d1234")).toBe(true);
    expect(isGuestCartKey("short")).toBe(false);
  });

  it("stores recent order numbers without duplicates", () => {
    expect(parseGuestOrderNumbers("mp-abc,MP-ABC,nope")).toEqual(["MP-ABC"]);
    expect(appendGuestOrderNumber("MP-OLD", "MP-NEW")).toBe("MP-NEW,MP-OLD");
  });
});
