import { abbreviateRegion, sanitizeDisplayName, truncateProductHint } from "./anonymize";

export type ComposedSocialProof = {
  /** Single-line copy (legacy / API consumers). */
  message: string;
  productHint?: string;
  /** Bold headline in toast (first name / safe handle). */
  displayName: string;
  /** Subline under the name (TrustPulse-style action sentence). */
  actionLine: string;
  /** Optional geography line (e.g. city + state). */
  locationLine: string | null;
};

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

export function composeSocialProofMessage(p: ComposeParams): ComposedSocialProof {
  const displayName = sanitizeDisplayName(p.shippingFullName, p.userName);
  const locationLine = formatLocationSnippet(p);
  const loc = locationLine ? ` from ${locationLine}` : "";
  let productHint: string | undefined;
  if (p.primaryLineTitle?.trim()) {
    productHint = truncateProductHint(p.primaryLineTitle.trim());
  }
  const purchase = productHint
    ? ` purchased ${productHint}`
    : " just completed an order";
  const message = `${displayName}${loc}${purchase}`;
  const actionLine = productHint ? `Purchased ${productHint}.` : "Just completed an order.";
  return { message, productHint, displayName, actionLine, locationLine };
}
