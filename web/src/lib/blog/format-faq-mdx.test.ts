import { describe, expect, it } from "vitest";
import { formatFaqAnswersOnOwnLine } from "./format-faq-mdx";

describe("formatFaqAnswersOnOwnLine", () => {
  it("leaves posts without an FAQ heading unchanged", () => {
    const src = "## Intro\n\n**What is this?** Still the same paragraph.\n";
    expect(formatFaqAnswersOnOwnLine(src)).toBe(src);
  });

  it("puts a bold FAQ answer on the next line", () => {
    const src = "## Frequently Asked Questions (FAQs)\n\n**Is it safe?** It depends on the label.\n";
    expect(formatFaqAnswersOnOwnLine(src)).toContain("**Is it safe?**\n\nIt depends on the label.");
  });

  it("splits a heading that includes the answer", () => {
    const src = "## FAQ\n\n### How long does it last? About twelve hours.\n";
    expect(formatFaqAnswersOnOwnLine(src)).toContain("### How long does it last?\n\nAbout twelve hours.");
  });
});
