import { describe, expect, it } from "vitest";
import { preferredSourceQuery } from "./preferred-sources-button";

describe("preferredSourceQuery", () => {
  it("uses the public host on localhost", () => {
    expect(preferredSourceQuery("localhost")).toBe("modempic.com");
  });

  it("strips www from the live host", () => {
    expect(preferredSourceQuery("www.modempic.com")).toBe("modempic.com");
  });
});
