export const SOCIAL_PROOF_DISPLAY_COUNT_MIN = 7;
export const SOCIAL_PROOF_DISPLAY_COUNT_MAX = 300;

const DISPLAY_COUNT_SPAN =
  SOCIAL_PROOF_DISPLAY_COUNT_MAX - SOCIAL_PROOF_DISPLAY_COUNT_MIN + 1;

/** Clamp any people-count figure shown in social proof to the allowed display band. */
export function clampSocialProofDisplayCount(value: number): number {
  const n = Math.floor(Number.isFinite(value) ? value : SOCIAL_PROOF_DISPLAY_COUNT_MIN);
  return Math.min(
    SOCIAL_PROOF_DISPLAY_COUNT_MAX,
    Math.max(SOCIAL_PROOF_DISPLAY_COUNT_MIN, n),
  );
}

/** Deterministic hash → integer in [7, 300] for social-proof display counts. */
export function getSocialProofDisplayCount(seed: string): number {
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  const normalized = (hash >>> 0) % DISPLAY_COUNT_SPAN;
  return SOCIAL_PROOF_DISPLAY_COUNT_MIN + normalized;
}

/** Human-readable window label for aggregate/combo copy. */
export function formatAggregateWindow(hours: number): string {
  if (hours <= 24) return "24 hours";
  if (hours <= 168) return "7 days";
  return "30 days";
}
