export const SOCIAL_PROOF_DISPLAY_COUNT_MIN = 3;
export const SOCIAL_PROOF_DISPLAY_COUNT_MAX = 50;
/** Live “people viewing this page” counter — never lower than this. */
export const SOCIAL_PROOF_VIEWER_COUNT_MIN = 7;
/** Live “people viewing this page” counter — never higher than this. */
export const SOCIAL_PROOF_VIEWER_COUNT_MAX = 20;

function clampCount(value: number, min: number, max: number): number {
  const n = Math.floor(Number.isFinite(value) ? value : min);
  return Math.min(max, Math.max(min, n));
}

function hashInRange(seed: string, min: number, max: number): number {
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  const span = max - min + 1;
  return min + ((hash >>> 0) % span);
}

/** Clamp purchase/aggregate people-count figures to the allowed display band. */
export function clampSocialProofDisplayCount(value: number): number {
  return clampCount(value, SOCIAL_PROOF_DISPLAY_COUNT_MIN, SOCIAL_PROOF_DISPLAY_COUNT_MAX);
}

/** Clamp live viewer counts so “people viewing this page” never exceeds 20. */
export function clampSocialProofViewerCount(value: number): number {
  return clampCount(value, SOCIAL_PROOF_VIEWER_COUNT_MIN, SOCIAL_PROOF_VIEWER_COUNT_MAX);
}

/** Deterministic hash → integer in [3, 50] for purchase/aggregate display counts. */
export function getSocialProofDisplayCount(seed: string): number {
  return hashInRange(seed, SOCIAL_PROOF_DISPLAY_COUNT_MIN, SOCIAL_PROOF_DISPLAY_COUNT_MAX);
}

/** Deterministic hash → integer in [7, 20] for live viewer counters. */
export function getSocialProofViewerCount(seed: string): number {
  return hashInRange(seed, SOCIAL_PROOF_VIEWER_COUNT_MIN, SOCIAL_PROOF_VIEWER_COUNT_MAX);
}

/** Human-readable window label for aggregate/combo copy. */
export function formatAggregateWindow(hours: number): string {
  if (hours <= 24) return "24 hours";
  if (hours <= 168) return "7 days";
  return "30 days";
}
