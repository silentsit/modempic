/**
 * WooCommerce imports sometimes concatenate trust bullets into `shortDesc`, which we already render via `ProductTrustBullets`.
 * Decode leftover entities and strip that suffix at display time (DB/admin can keep the raw import for edits).
 */
const HTML_ENTITIES: Record<string, string> = {
  nbsp: " ",
  amp: "&",
  quot: '"',
  apos: "'",
  lt: "<",
  gt: ">",
  ndash: "–",
  mdash: "—",
};

function decodeImportedHtml(value: string) {
  let current = value;
  for (let i = 0; i < 3; i += 1) {
    const next = current.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (match, entity: string) => {
      const named = HTML_ENTITIES[entity.toLowerCase()];
      if (named) return named;
      if (entity.startsWith("#x") || entity.startsWith("#X")) {
        const code = Number.parseInt(entity.slice(2), 16);
        return Number.isFinite(code) ? String.fromCodePoint(code) : match;
      }
      if (entity.startsWith("#")) {
        const code = Number.parseInt(entity.slice(1), 10);
        return Number.isFinite(code) ? String.fromCodePoint(code) : match;
      }
      return match;
    });
    if (next === current) break;
    current = next;
  }
  return current.replace(/\s+/g, " ").trim();
}

const TRUST_SUFFIX_RE =
  /\s*(?:→|–|—)\s*(?:FREE\s+express\s+delivery|100%\s+FREE|Guaranteed\s+delivery|Secure\s+(?:&|and)\s+discreet)|\s+24-hour\s+customer\s+support/i;

export function storefrontShortDesc(shortDesc: string): string {
  const decoded = decodeImportedHtml(shortDesc);
  const idx = decoded.search(TRUST_SUFFIX_RE);
  if (idx === -1) return decoded;
  return decoded.slice(0, idx).trimEnd();
}
