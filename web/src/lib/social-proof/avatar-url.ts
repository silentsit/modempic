const SOMEONE = "Someone";

function stableHash(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
}

/** Deterministic headshot for roughly half of display names (stable per person). */
export function resolveSocialProofAvatarUrl(displayName: string): string | null {
  const key = displayName.trim();
  if (!key || key === SOMEONE) return null;

  const hash = stableHash(key.toLowerCase());
  if (hash % 100 >= 48) return null;

  const imgId = (hash % 70) + 1;
  return `https://i.pravatar.cc/128?img=${imgId}`;
}
