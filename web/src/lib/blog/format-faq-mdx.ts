/**
 * Keep FAQ answers on the line after the question across imported WordPress/MDX posts.
 * Does not change copy — only inserts a break after a trailing "?".
 */
export function formatFaqAnswersOnOwnLine(mdx: string): string {
  const faqHeading = /^(#{2,4}[ \t]+.*\bfaqs?\b.*)$/im.exec(mdx);
  if (!faqHeading || faqHeading.index == null) return mdx;

  const start = faqHeading.index;
  const before = mdx.slice(0, start);
  let section = mdx.slice(start);

  const nextH2 = section.slice(faqHeading[0].length).search(/\n##[ \t]+/);
  const rest = nextH2 >= 0 ? section.slice(faqHeading[0].length + nextH2) : "";
  if (nextH2 >= 0) {
    section = section.slice(0, faqHeading[0].length + nextH2);
  }

  section = section
    // **Question?** Answer → **Question?**\n\nAnswer
    .replace(/(\*\*[^*\n]+\?\*\*)[ \t]+(?=\S)/g, "$1\n\n")
    // ### Question? Answer on the same heading line
    .replace(/^(#{3,4}[ \t]+.+?\?)[ \t]+(?=[A-Za-z])/gm, "$1\n\n")
    // 1. Question? Answer (plain list item, no bold/heading)
    .replace(/^([ \t]*(?:\d+\.|-|\*)[ \t]+[^\n]{8,180}\?)[ \t]+(?=[A-Za-z])/gm, "$1\n\n");

  return before + section + rest;
}
