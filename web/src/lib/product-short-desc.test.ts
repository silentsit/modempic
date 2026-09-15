import { describe, expect, it } from "vitest";
import { storefrontShortDesc } from "./product-short-desc";

describe("storefrontShortDesc", () => {
  it("keeps a clean product blurb", () => {
    expect(storefrontShortDesc("Buy Modalert 200 mg online at live USD checkout.")).toBe(
      "Buy Modalert 200 mg online at live USD checkout.",
    );
  });

  it("decodes imported entities and strips the WooCommerce trust dump", () => {
    const raw =
      "Buy Starter Pack Combo: Get 10 or 20 tablets each of Artvigil 150 mg, Waklert 150 mg, and Modalert 200 mg for enhanced focus, alertness, and productivity. →&nbsp;FREE &nbsp;express delivery over $300 → US: 7 – 14 days | EUR: &nbsp;— 11 days | SE Asia: 4 – 6 days →&nbsp;Guaranteed &nbsp;delivery worldwide →&nbsp;Secure &nbsp;&amp; discreet packaging 24-hour customer support via email";

    expect(storefrontShortDesc(raw)).toBe(
      "Buy Starter Pack Combo: Get 10 or 20 tablets each of Artvigil 150 mg, Waklert 150 mg, and Modalert 200 mg for enhanced focus, alertness, and productivity.",
    );
  });

  it("decodes double-encoded entities before stripping the dump", () => {
    const raw =
      "Buy Starter Pack Combo: Get 10 or 20 tablets each of Artvigil 150 mg, Waklert 150 mg, and Modalert 200 mg for enhanced focus, alertness, and productivity. →&amp;nbsp;FREE &amp;nbsp;express delivery over $300";

    expect(storefrontShortDesc(raw)).toBe(
      "Buy Starter Pack Combo: Get 10 or 20 tablets each of Artvigil 150 mg, Waklert 150 mg, and Modalert 200 mg for enhanced focus, alertness, and productivity.",
    );
  });
});
