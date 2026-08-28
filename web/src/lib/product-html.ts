import sanitizeHtml from "sanitize-html";
import { titleCaseHeadingHtml } from "@/lib/text/heading-title-case";

function decodeHtmlAttr(value: string): string {
  return value
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");
}

function attr(tag: string, name: string): string | null {
  const m = new RegExp(`\\b${name}\\s*=\\s*("([^"]*)"|'([^']*)')`, "i").exec(tag);
  if (!m) return null;
  return decodeHtmlAttr(m[2] ?? m[3] ?? "");
}

function setOrRemoveAttr(tag: string, name: string, value: string | null): string {
  const re = new RegExp(`\\s${name}\\s*=\\s*("[^"]*"|'[^']*')`, "i");
  if (value == null || value === "") {
    return tag.replace(re, "");
  }
  const encoded = value.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
  if (re.test(tag)) return tag.replace(re, ` ${name}="${encoded}"`);
  return tag.replace(/\/?>$/, (end) => ` ${name}="${encoded}"${end}`);
}

function srcsetUrls(srcset: string): string[] {
  return srcset
    .split(",")
    .map((part) => part.trim().split(/\s+/)[0])
    .filter(Boolean);
}

/** Hosts left over from the Woo/NooFox import that no longer serve images. */
export function productBodyImageUrlIsUsable(raw: string): boolean {
  const url = decodeHtmlAttr(raw).trim();
  if (!url) return false;
  if (url.startsWith("data:") || url.startsWith("/")) return true;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return false;
    const host = parsed.hostname.replace(/^www\./, "").toLowerCase();
    if (host === "noofox.com") return false;
    if (host.includes("noofoxxx")) return false;
    if (host.endsWith(".local")) return false;
    if (host.endsWith(".kinsta.cloud")) return false;
    if (host === "on-page.ai" || host.endsWith(".on-page.ai")) return false;
    return true;
  } catch {
    return false;
  }
}

/**
 * Prefer a working `src`, drop dead Woo `srcset` (browsers would otherwise ignore a good `src`),
 * and remove images that only point at dead NooFox/local hosts.
 */
export function rewriteProductBodyImageHtml(html: string): string {
  return html.replace(/<img\b[^>]*>/gi, (tag) => {
    const src = attr(tag, "src") ?? attr(tag, "data-src");
    const srcset = attr(tag, "srcset") ?? attr(tag, "data-srcset");
    const candidates = [
      ...(src ? [src] : []),
      ...(srcset ? srcsetUrls(srcset) : []),
    ];
    const usable = candidates.find((url) => productBodyImageUrlIsUsable(url));
    if (!usable) return "";

    let next = tag;
    next = setOrRemoveAttr(next, "src", usable);
    next = setOrRemoveAttr(next, "srcset", null);
    next = setOrRemoveAttr(next, "data-src", null);
    next = setOrRemoveAttr(next, "data-srcset", null);
    next = setOrRemoveAttr(next, "sizes", null);
    if (!attr(next, "loading")) next = setOrRemoveAttr(next, "loading", "lazy");
    if (!attr(next, "decoding")) next = setOrRemoveAttr(next, "decoding", "async");
    return next;
  });
}

/** Allow typical WooCommerce/tab HTML while stripping scripts/handlers. */
export function sanitizeProductBodyHtml(unsafe: string): string {
  return rewriteProductBodyImageHtml(
    titleCaseHeadingHtml(
      sanitizeHtml(unsafe, {
        allowedTags: [
          ...sanitizeHtml.defaults.allowedTags,
          "h1",
          "h2",
          "h3",
          "h4",
          "h5",
          "h6",
          "figure",
          "figcaption",
          "img",
          "table",
          "thead",
          "tbody",
          "tr",
          "th",
          "td",
          "hr",
          "dl",
          "dt",
          "dd",
        ],
        allowedAttributes: {
          ...sanitizeHtml.defaults.allowedAttributes,
          img: ["src", "srcset", "alt", "width", "height", "loading", "class", "decoding"],
          table: ["class", "width", "border", "cellspacing", "cellpadding"],
          th: ["colspan", "rowspan", "scope", "class"],
          td: ["colspan", "rowspan", "class"],
          a: ["href", "name", "target", "rel", "class", "title"],
          div: ["class", "id"],
          span: ["class"],
        },
        allowedSchemesByTag: {
          ...sanitizeHtml.defaults.allowedSchemesByTag,
          img: ["http", "https", "data"],
        },
        transformTags: {
          h1: () => ({ tagName: "h2", attribs: {} }),
          a: (tagName, attribs) => ({
            tagName: "a",
            attribs: {
              ...attribs,
              rel: attribs.target === "_blank" ? "noopener noreferrer" : attribs.rel,
            },
          }),
        },
      }),
    ),
  );
}
