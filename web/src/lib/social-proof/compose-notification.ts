import { formatPurchaseDisplayName, truncateProductHint } from "./anonymize";
import { formatCountryStateLine } from "./geo/countries";

export type ComposedSocialProof = {
  /** Single-line copy (legacy / API consumers). */
  message: string;
  productHint?: string;
  /** Bold headline in toast (first name / safe handle). */
  displayName: string;
  /** Subline under the name (TrustPulse-style action sentence). */
  actionLine: string;
  /** Optional geography line (country name only). */
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
  return formatCountryStateLine(p.country);
}

function resolveDisplayName(p: ComposeParams): string {
  for (const source of [p.shippingFullName, p.userName]) {
    if (!source?.trim()) continue;
    const formatted = formatPurchaseDisplayName(source);
    if (formatted !== "Someone") return formatted;
  }
  return "Someone";
}

export function composeSocialProofMessage(p: ComposeParams): ComposedSocialProof {
  const displayName = resolveDisplayName(p);
  const locationLine = formatLocationSnippet(p);
  const loc = locationLine ? ` from ${locationLine}` : "";
  let productHint: string | undefined;
  if (p.primaryLineTitle?.trim()) {
    productHint = truncateProductHint(p.primaryLineTitle.trim());
  }
  const actionLine = productHint ? "just purchased" : "just completed an order";
  const message = productHint
    ? `${displayName}${loc} just purchased`
    : `${displayName}${loc} just completed an order`;
  return { message, productHint, displayName, actionLine, locationLine };
}
