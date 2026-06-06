import { describe, expect, it } from "vitest";
import { parseCheckoutForm } from "./checkout-form";

function makeCheckoutForm(overrides: Record<string, string> = {}) {
  const fd = new FormData();
  const defaults: Record<string, string> = {
    paymentMethod: "CRYPTO",
    asset: "USDT",
    billFirstName: "Jane",
    billLastName: "Doe",
    billLine1: "123 Main St",
    billCity: "Austin",
    billState: "tx",
    billPostal: "78701",
    billCountry: "us",
    ...overrides,
  };
  for (const [key, value] of Object.entries(defaults)) {
    fd.set(key, value);
  }
  return fd;
}

describe("parseCheckoutForm", () => {
  it("parses billing-only checkout when shipDifferent is off", () => {
    const parsed = parseCheckoutForm(makeCheckoutForm());
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.value.paymentMethod).toBe("CRYPTO");
    expect(parsed.value.ship.fullName).toBe("Jane Doe");
    expect(parsed.value.bill.state).toBe("TX");
    expect(parsed.value.bill.country).toBe("US");
  });

  it("parses separate shipping address when shipDifferent is on", () => {
    const parsed = parseCheckoutForm(
      makeCheckoutForm({
        shipDifferent: "on",
        shipFirstName: "Sam",
        shipLastName: "Lee",
        shipLine1: "9 Harbor Rd",
        shipCity: "Boston",
        shipState: "ma",
        shipPostal: "02108",
      }),
    );
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.value.ship.fullName).toBe("Sam Lee");
    expect(parsed.value.bill.fullName).toBe("Jane Doe");
  });

  it("rejects incomplete addresses", () => {
    const parsed = parseCheckoutForm(makeCheckoutForm({ billLine1: "" }));
    expect(parsed.ok).toBe(false);
  });
});
