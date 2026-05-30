/** Deterministic hash → integer in [50, 999] for social-proof display counts. */
export function getSocialProofDisplayCount(seed: string): number {
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  const normalized = (hash >>> 0) % 950;
  return 50 + normalized;
}

/** Human-readable window label for aggregate/combo copy. */
export function formatAggregateWindow(hours: number): string {
  if (hours <= 24) return "24 hours";
  if (hours <= 168) return "7 days";
  return "30 days";
}
