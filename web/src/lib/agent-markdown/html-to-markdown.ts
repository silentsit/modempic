import * as cheerio from "cheerio";
import TurndownService from "turndown";

const turndown = new TurndownService({
  headingStyle: "atx",
  codeBlockStyle: "fenced",
  bulletListMarker: "-",
});
turndown.remove(["script", "style", "noscript", "iframe"]);

export function htmlToMarkdown(html: string): string {
  const $ = cheerio.load(html);
  $("script, style, noscript, iframe, template").remove();
  const title = $("title").first().text().replace(/\s+/g, " ").trim();
  const fragment = $("main").html() || $("article").html() || $("body").html() || html;
  const body = turndown.turndown(fragment).trim();
  if (title && !body.startsWith(`# ${title}`)) {
    return `# ${title}\n\n${body}\n`;
  }
  return `${body}\n`;
}

/** Cloudflare-style estimate (~4 characters per token). */
export function estimateMarkdownTokens(text: string): number {
  return Math.max(1, Math.ceil(text.length / 4));
}
