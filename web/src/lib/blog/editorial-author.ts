/**
 * Storefront byline for catalog articles, matching Tetrava's "Editorial Team"
 * pattern: an organization name, not "Admin" and not an invented clinician.
 */
export const EDITORIAL_TEAM_NAME = "Modempic Editorial Team";

const GENERIC_AUTHOR = /^(admin|modempic(\s+admin)?)$/i;

export function isGenericBlogAuthorName(name: string | null | undefined): boolean {
  const raw = name?.trim();
  if (!raw) return true;
  if (GENERIC_AUTHOR.test(raw)) return true;
  return raw.toLowerCase() === EDITORIAL_TEAM_NAME.toLowerCase();
}

export function blogAuthorDisplayName(name: string | null | undefined): string {
  return isGenericBlogAuthorName(name) ? EDITORIAL_TEAM_NAME : name!.trim();
}

export function blogAuthorJsonLd(
  name: string | null | undefined,
  organizationId: string,
): { "@id": string; "@type": "Organization"; name: string } | { "@type": "Person"; name: string } {
  if (isGenericBlogAuthorName(name)) {
    return {
      "@id": organizationId,
      "@type": "Organization",
      name: EDITORIAL_TEAM_NAME,
    };
  }
  return { "@type": "Person", name: name!.trim() };
}
