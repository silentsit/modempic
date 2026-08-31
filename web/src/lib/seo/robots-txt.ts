import { getSiteUrl } from "@/lib/site-url";

/**
 * Search-only Content Signals (https://contentsignals.org/).
 * Google may index; AI training and AI-input (RAG / AI summaries) are declined.
 */
export const CONTENT_SIGNAL = "ai-train=no, search=yes, ai-input=no";

export const ROBOTS_DISALLOW_PATHS = [
  "/admin",
  "/api/",
  "/account",
  "/cart",
  "/checkout",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/order",
] as const;

/** Official Content Signals Policy preamble from contentsignals.org. */
const CONTENT_SIGNALS_PREAMBLE = `# As a condition of accessing this website, you agree to abide by the following
# content signals:
# (a)  If a content-signal = yes, you may collect content for the corresponding use.
# (b)  If a content-signal = no, you may not collect content for the corresponding use.
# (c)  If the website operator does not include a content signal for a corresponding
#      use, the website operator neither grants nor restricts permission via content
#      signal with respect to the corresponding use.
# The content signals and their meanings are:
# search:   building a search index and providing search results (e.g., returning
#           hyperlinks and short excerpts from your website's contents). Search does
#           not include providing AI-generated search summaries.
# ai-input: inputting content into one or more AI models (e.g., retrieval augmented
#           generation, grounding, or other real-time taking of content for
#           generative AI search answers).
# ai-train: training or fine-tuning AI models.
# ANY RESTRICTIONS EXPRESSED VIA CONTENT SIGNALS ARE EXPRESS RESERVATIONS OF RIGHTS
# UNDER ARTICLE 4 OF THE EUROPEAN UNION DIRECTIVE 2019/790 ON COPYRIGHT AND RELATED
# RIGHTS IN THE DIGITAL SINGLE MARKET.`;

export function renderRobotsTxt(baseUrl = getSiteUrl()) {
  const base = baseUrl.replace(/\/$/, "");
  const disallows = ROBOTS_DISALLOW_PATHS.map((path) => `Disallow: ${path}`).join("\n");

  return `${CONTENT_SIGNALS_PREAMBLE}

User-Agent: *
Content-Signal: ${CONTENT_SIGNAL}
Allow: /
${disallows}

Sitemap: ${base}/sitemap.xml
`;
}

export function robotsTxtResponse(body: string) {
  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=3600, must-revalidate",
    },
  });
}
