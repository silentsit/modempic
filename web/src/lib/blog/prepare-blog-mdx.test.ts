import { describe, expect, it } from "vitest";
import { HUMANIZE_MARKER, prepareBlogMdxForRender, stripHumanizeMarker } from "./prepare-blog-mdx";
import { gfmTablesToHtml } from "./gfm-tables-to-html";

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

  it("turns GFM pipe tables into HTML tables", () => {
    const src = `${HUMANIZE_MARKER}\n## Glance\n\n| Attribute | A | B |\n|---|---|---|\n| Class | Wake | Stim |\n`;
    const out = prepareBlogMdxForRender(src);
    expect(out).toContain("<table>");
    expect(out).toContain('class="blog-table-scroll"');
    expect(out).toContain("<th>Attribute</th>");
    expect(out).toContain("<td>Wake</td>");
    expect(out).not.toMatch(/^\| Attribute \|/m);
  });
});

describe("gfmTablesToHtml", () => {
  it("converts markdown links inside cells", () => {
    const src = `| Attribute | Drug |\n|---|---|\n| Label | [FDA](https://www.fda.gov/example) note |\n`;
    const out = gfmTablesToHtml(src);
    expect(out).toContain('<a href="https://www.fda.gov/example">FDA</a> note');
  });

  it("leaves existing HTML tables alone", () => {
    const src = "<table>\n<thead>\n<tr>\n<th>A</th>\n</tr>\n</thead>\n</table>\n";
    expect(gfmTablesToHtml(src)).toBe(src);
  });
});
