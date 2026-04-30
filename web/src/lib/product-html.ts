import sanitizeHtml from "sanitize-html";

/** Allow typical WooCommerce/tab HTML while stripping scripts/handlers. */
export function sanitizeProductBodyHtml(unsafe: string): string {
  return sanitizeHtml(unsafe, {
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
      a: (tagName, attribs) => ({
        tagName: "a",
        attribs: {
          ...attribs,
          rel: attribs.target === "_blank" ? "noopener noreferrer" : attribs.rel,
        },
      }),
    },
  });
}
