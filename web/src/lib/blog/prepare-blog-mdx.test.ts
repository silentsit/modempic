import { describe, expect, it } from "vitest";
import { HUMANIZE_MARKER, prepareBlogMdxForRender, stripHumanizeMarker } from "./prepare-blog-mdx";

describe("stripHumanizeMarker", () => {
  it("removes the humanize marker from the first line", () => {
    const src = `${HUMANIZE_MARKER}\n## Title\n\nBody.`;
    expect(stripHumanizeMarker(src)).toBe("## Title\n\nBody.");
  });

  it("leaves MDX without the marker unchanged", () => {
    const src = "## Title\n\nBody.";
    expect(stripHumanizeMarker(src)).toBe(src);
  });
});

describe("prepareBlogMdxForRender", () => {
  it("strips the marker and still formats FAQ answers", () => {
    const src = `${HUMANIZE_MARKER}\n## FAQ\n\n**Is it safe?** It depends.\n`;
    expect(prepareBlogMdxForRender(src)).toContain("**Is it safe?**\n\nIt depends.");
    expect(prepareBlogMdxForRender(src)).not.toContain(HUMANIZE_MARKER);
  });
});
