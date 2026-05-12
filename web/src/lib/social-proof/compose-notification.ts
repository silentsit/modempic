import { abbreviateRegion, sanitizeDisplayName, truncateProductHint } from "./anonymize";

export type ComposeParams = {
  shippingFullName?: string | null;
  userName?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  primaryLineTitle?: string | null;
};

export function formatLocationSnippet(p: ComposeParams): string | null {
  const city = p.city?.replace(/\s+/g, " ").trim();
  const state = abbreviateRegion(p.country, p.state);
  if (city && state) return `${city}, ${state}`;
  if (city) return city;
  if (state) return state;
  return null;
}

export function composeSocialProofMessage(p: ComposeParams): { message: string; productHint?: string } {
  const who = sanitizeDisplayName(p.shippingFullName, p.userName);
  const where = formatLocationSnippet(p);
  const loc = where ? ` from ${where}` : "";
  let productHint: string | undefined;
  if (p.primaryLineTitle?.trim()) {
    productHint = truncateProductHint(p.primaryLineTitle.trim());
  }
  const purchase = productHint
    ? ` purchased ${productHint}`
    : " just completed an order";
  const message = `${who}${loc}${purchase}`;
  return { message, productHint };
}
