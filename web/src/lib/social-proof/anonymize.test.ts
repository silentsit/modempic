import { describe, expect, it } from "vitest";
import {
  abbreviateRegion,
  extractFirstNameLikeToken,
  sanitizeDisplayName,
  truncateProductHint,
} from "./anonymize";
import { composeSocialProofMessage, formatLocationSnippet } from "./compose-notification";

describe("extractFirstNameLikeToken", () => {
  it("takes leading given name segment", () => {
    expect(extractFirstNameLikeToken("Maria Garcia")).toBe("Maria");
  });

  it("skips leading junk", () => {
    expect(extractFirstNameLikeToken("123 🔥 Lisa Ann")).toBe("Lisa");
  });

  it("keeps hyphen inside first segment", () => {
    expect(extractFirstNameLikeToken("Mary-Jane Watson")).toBe("Mary-Jane");
  });
});

describe("sanitizeDisplayName", () => {
  it("prefers shipping full name then user profile name", () => {
    expect(sanitizeDisplayName("jordan smith", null)).toBe("Jordan");
    expect(sanitizeDisplayName(null, "Taylor")).toBe("Taylor");
    expect(sanitizeDisplayName(undefined, undefined)).toBe("Someone");
  });

  it("rejects initials-only and non-name tokens", () => {
    expect(sanitizeDisplayName("J. Smith", null)).toBe("Someone");
    expect(sanitizeDisplayName("### 123", null)).toBe("Someone");
  });

  it("handles emoji-heavy strings", () => {
    expect(sanitizeDisplayName("🔥🔥🔥", null)).toBe("Someone");
  });

  it("capitalizes sane first tokens", () => {
    expect(sanitizeDisplayName("ALEX rivera", null)).toBe("Alex");
    expect(sanitizeDisplayName("mary-jane smith", null)).toBe("Mary-Jane");
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
    expect(abbreviateRegion("US", "NY")).toBe("NY");
  });

  it("title-cases full region names instead of truncating", () => {
    expect(abbreviateRegion("US", "texas")).toBe("Texas");
    expect(abbreviateRegion("US", "new york")).toBe("New York");
  });
});

describe("composeSocialProofMessage", () => {
  it("formats location and purchase line without product hint", () => {
    expect(
      composeSocialProofMessage({
        shippingFullName: "Jordan Smith",
        userName: null,
        city: "Denver",
        state: "CO",
        country: "US",
        primaryLineTitle: null,
      }).message,
    ).toContain("Jordan from Denver, CO");
    expect(
      composeSocialProofMessage({
        shippingFullName: "Jordan Smith",
        userName: null,
        city: "Denver",
        state: "CO",
        country: "US",
        primaryLineTitle: null,
      }).message,
    ).toContain("completed an order");
  });

  it("uses purchased wording when primary line exists", () => {
    const { message } = composeSocialProofMessage({
      shippingFullName: "A Person",
      userName: null,
      city: null,
      state: null,
      country: null,
      primaryLineTitle: "Sleep Support Caps",
    });
    expect(message).toContain("purchased Sleep Support Caps");
  });
});

describe("formatLocationSnippet", () => {
  it("returns null when no geography", () => {
    expect(formatLocationSnippet({})).toBeNull();
  });
});
