import { formatFaqAnswersOnOwnLine } from "./format-faq-mdx";
import { gfmTablesToHtml } from "./gfm-tables-to-html";

export const HUMANIZE_MARKER = "<!-- modempic:humanized -->";

/** Remove the agent humanize marker before MDX compilation or DB storage. */
export function stripHumanizeMarker(mdx: string): string {
  const trimmed = mdx.trimStart();
  if (!trimmed.startsWith(HUMANIZE_MARKER)) return mdx;
  return trimmed.slice(HUMANIZE_MARKER.length).replace(/^\s*/, "");
}

/** Normalize blog MDX from Prisma/scripts for next-mdx-remote. */
export function prepareBlogMdxForRender(mdx: string): string {
  return formatFaqAnswersOnOwnLine(gfmTablesToHtml(stripHumanizeMarker(mdx)));
}
