import { describe, expect, it } from "vitest";
import { resolveSocialProofAvatarUrl } from "./avatar-url";

describe("resolveSocialProofAvatarUrl", () => {
  it("returns null for empty or Someone", () => {
    expect(resolveSocialProofAvatarUrl("")).toBeNull();
    expect(resolveSocialProofAvatarUrl("Someone")).toBeNull();
  });

  it("is stable for the same display name", () => {
    const first = resolveSocialProofAvatarUrl("Jordan R.");
    const second = resolveSocialProofAvatarUrl("Jordan R.");
    expect(first).toBe(second);
  });

  it("returns a pravatar URL when a headshot is assigned", () => {
    const names = ["Alex R.", "Jordan S.", "Mei L.", "Taylor B.", "Sam P.", "Riley J."];
    const urls = names.map((name) => resolveSocialProofAvatarUrl(name)).filter(Boolean);
    expect(urls.length).toBeGreaterThan(0);
    for (const url of urls) {
      expect(url).toMatch(/^https:\/\/i\.pravatar\.cc\/128\?img=\d+$/);
    }
  });
});
