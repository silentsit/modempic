import { describe, expect, it } from "vitest";
import {
  abbreviateRegion,
  extractFirstNameLikeToken,
  formatPurchaseDisplayName,
  sanitizeDisplayName,
  truncateProductHint,
} from "./anonymize";
import { composeSocialProofMessage, formatLocationSnippet } from "./compose-notification";

describe("extractFirstNameLikeToken", () => {
  it("takes leading given name segment", () => {
    expect(extractFirstNameLikeToken("Maria Garcia")).toBe("Maria");
  });
});

describe("sanitizeDisplayName", () => {
  it("prefers shipping full name then user profile name", () => {
    expect(sanitizeDisplayName("jordan smith", null)).toBe("Jordan");
    expect(sanitizeDisplayName(null, "Taylor")).toBe("Taylor");
    expect(sanitizeDisplayName(undefined, undefined)).toBe("Someone");
  });
});

describe("truncateProductHint", () => {
  it("adds ellipsis when needed", () => {
    expect(truncateProductHint("x".repeat(60), 10).endsWith("…")).toBe(true);
  });
});

describe("abbreviateRegion", () => {
  it("uppercases two-letter region codes", () => {
    expect(abbreviateRegion("US", "co")).toBe("CO");
  });
});

describe("formatPurchaseDisplayName", () => {
  it("returns first name and last initial", () => {
    expect(formatPurchaseDisplayName("Charles Thompson")).toBe("Charles T.");
    expect(formatPurchaseDisplayName("jordan smith")).toBe("Jordan S.");
  });

  it("returns first name only when no surname", () => {
    expect(formatPurchaseDisplayName("Taylor")).toBe("Taylor");
  });

  it("returns Someone for invalid input", () => {
    expect(formatPurchaseDisplayName("J.")).toBe("Someone");
    expect(formatPurchaseDisplayName("")).toBe("Someone");
  });
});

describe("composeSocialProofMessage", () => {
  it("formats location and order line without product hint", () => {
    const c = composeSocialProofMessage({
      shippingFullName: "Jordan Smith",
      userName: null,
      city: "Denver",
      state: "CO",
      country: "US",
      primaryLineTitle: null,
    });
    expect(c.message).toContain("Jordan S. from Denver, CO");
    expect(c.message).toContain("just completed an order");
    expect(c.displayName).toBe("Jordan S.");
    expect(c.locationLine).toBe("Denver, CO");
    expect(c.actionLine).toBe("just completed an order");
  });

  it("uses just purchased action when primary line exists", () => {
    const c = composeSocialProofMessage({
      shippingFullName: "A Person",
      userName: null,
      city: null,
      state: null,
      country: null,
      primaryLineTitle: "Sleep Support Caps",
    });
    expect(c.message).toContain("just purchased");
    expect(c.actionLine).toBe("just purchased");
    expect(c.productHint).toBe("Sleep Support Caps");
  });
});

describe("formatLocationSnippet", () => {
  it("returns null when no geography", () => {
    expect(formatLocationSnippet({})).toBeNull();
  });
});
