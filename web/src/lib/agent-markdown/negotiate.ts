/** True when the client prefers `text/markdown` over `text/html` (RFC 9110 Accept). */
export function prefersMarkdown(accept: string | null | undefined): boolean {
  if (!accept) return false;
  const parts = accept.split(",").map((part) => {
    const [rawType, ...params] = part.trim().split(";");
    const type = rawType.trim().toLowerCase();
    let q = 1;
    for (const param of params) {
      const [key, value] = param.trim().split("=");
      if (key === "q" && value) {
        const n = Number(value);
        if (Number.isFinite(n)) q = n;
      }
    }
    return { type, q };
  });

  const markdown = parts.find((part) => part.type === "text/markdown" && part.q > 0);
  if (!markdown) return false;
  const html = parts.find(
    (part) => (part.type === "text/html" || part.type === "application/xhtml+xml") && part.q > 0,
  );
  if (!html) return true;
  return markdown.q >= html.q;
}

const SKIP_PREFIXES = [
  "/_next",
  "/api",
  "/admin",
  "/account",
  "/.well-known",
  "/openapi",
  "/docs",
  "/oauth",
  "/cart",
  "/checkout",
];
const SKIP_EXACT = new Set([
  "/robots.txt",
  "/auth.md",
  "/llms.txt",
  "/sitemap.xml",
  "/sitemap.xsl",
  "/manifest.webmanifest",
]);
const SKIP_SUFFIXES = ["-sitemap.xml", ".xml"];

function hasPathPrefix(pathname: string, prefix: string) {
  const base = prefix.endsWith("/") ? prefix.slice(0, -1) : prefix;
  return pathname === base || pathname.startsWith(`${base}/`);
}

export function isMarkdownNegotiablePath(pathname: string): boolean {
  if (pathname !== "/" && pathname.endsWith("/")) {
    return isMarkdownNegotiablePath(pathname.replace(/\/+$/, "") || "/");
  }
  if (SKIP_EXACT.has(pathname)) return false;
  if (SKIP_PREFIXES.some((prefix) => hasPathPrefix(pathname, prefix))) return false;
  if (SKIP_SUFFIXES.some((suffix) => pathname.endsWith(suffix))) return false;
  if (/\.[a-z0-9]{1,8}$/i.test(pathname)) return false;
  return true;
}

export function safeMarkdownSourcePath(raw: string | null): string | null {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//") || raw.includes("://")) return null;
  let pathname: string;
  let search = "";
  try {
    const parsed = new URL(raw, "http://modempic.invalid");
    if (parsed.origin !== "http://modempic.invalid") return null;
    pathname = parsed.pathname;
    search = parsed.search;
  } catch {
    return null;
  }
  if (!pathname || !isMarkdownNegotiablePath(pathname)) return null;
  return pathname + search;
}

export const MARKDOWN_BYPASS_HEADER = "x-markdown-bypass";
export const MARKDOWN_SOURCE_PATH_HEADER = "x-markdown-source-path";
