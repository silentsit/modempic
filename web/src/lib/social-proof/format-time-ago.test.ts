import { describe, expect, it } from "vitest";
import { formatTimeAgo } from "./format-time-ago";

describe("formatTimeAgo", () => {
  const now = new Date("2026-05-30T12:00:00.000Z");

  it("returns bucketed labels", () => {
    expect(formatTimeAgo(new Date("2026-05-30T11:59:30.000Z"), now)).toBe("just now");
    expect(formatTimeAgo(new Date("2026-05-30T11:57:00.000Z"), now)).toBe("1 min ago");
    expect(formatTimeAgo(new Date("2026-05-30T11:52:00.000Z"), now)).toBe("5 min ago");
    expect(formatTimeAgo(new Date("2026-05-30T11:00:00.000Z"), now)).toBe("1h ago");
    expect(formatTimeAgo(new Date("2026-05-29T12:00:00.000Z"), now)).toBe("1 day ago");
    expect(formatTimeAgo(new Date("2026-05-26T12:00:00.000Z"), now)).toBe("3 days ago");
  });

  it("handles invalid dates", () => {
    expect(formatTimeAgo("not-a-date", now)).toBe("some time ago");
  });
});
