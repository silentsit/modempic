import { describe, expect, it } from "vitest";
import { whatsappE164, whatsappHref } from "./whatsapp";

describe("whatsapp helpers", () => {
  it("accepts the default E.164 digits", () => {
    expect(whatsappE164("")).toBe("66620272123");
    expect(whatsappHref()).toBe("https://wa.me/66620272123");
  });

  it("strips formatting from an override", () => {
    expect(whatsappE164("+66 62 027 2123")).toBe("66620272123");
    expect(whatsappHref("Hello", "+66 62 027 2123")).toBe(
      "https://wa.me/66620272123?text=Hello",
    );
  });

  it("rejects impossible lengths", () => {
    expect(whatsappE164("123")).toBeNull();
    expect(whatsappHref(undefined, "123")).toBeNull();
  });
});
