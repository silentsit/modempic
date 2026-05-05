/**
 * WooCommerce imports sometimes concatenate trust bullets into `shortDesc`, which we already render via `ProductTrustBullets`.
 * Strip that redundant suffix at display time (DB/admin keeps full text for edits).
 */
export function storefrontShortDesc(shortDesc: string): string {
  const idx = shortDesc.search(/\s*→\s*FREE\s+express\s+delivery/i);
  if (idx === -1) return shortDesc.trimEnd();
  return shortDesc.slice(0, idx).trimEnd();
}
