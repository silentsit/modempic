const SOMEONE = "Someone";

/** First whitespace-delimited segment that starts with a letter. */
export function extractFirstNameLikeToken(raw: string): string {
  const normalized = raw.replace(/\s+/g, " ").trim();
  if (!normalized) return "";
  for (const part of normalized.split(" ")) {
    const trimmed = part.trim();
    if (/^[\p{L}]/u.test(trimmed)) {
      return trimmed.replace(/[^\p{L}\-'’.]/gu, "");
    }
  }
  return "";
}

/** First name + last initial for purchase notifications (e.g. "Charles T."). */
export function formatPurchaseDisplayName(fullName: string): string {
  const normalized = fullName.replace(/\s+/g, " ").trim();
  if (!normalized) return SOMEONE;

  const firstToken = extractFirstNameLikeToken(normalized);
  const lettersOnly = firstToken.replace(/[^\p{L}]/gu, "");
  if (lettersOnly.length < 2) return SOMEONE;

  const titled = firstToken
    .toLowerCase()
    .replace(/(^|[\-'])([\p{L}])/gu, (_, sep: string, letter: string) => `${sep}${letter.toUpperCase()}`);

  const parts = normalized.split(" ").filter(Boolean);
  let lastInitial = "";
  for (let i = parts.length - 1; i >= 0; i--) {
    const part = parts[i]!;
    const letters = part.replace(/[^\p{L}]/gu, "");
    if (!letters) continue;
    if (letters.toLowerCase() === lettersOnly.toLowerCase()) continue;
    lastInitial = letters.charAt(0).toUpperCase();
    break;
  }

  if (lastInitial) return `${titled} ${lastInitial}.`;
  return titled;
}

/** Public-safe display handle for toast copy (never full surname). */
export function sanitizeDisplayName(shippingFullName?: string | null, userName?: string | null): string {
  for (const source of [shippingFullName, userName]) {
    if (!source?.trim()) continue;
    const token = extractFirstNameLikeToken(source);
    const lettersOnly = token.replace(/[^\p{L}]/gu, "");
    if (lettersOnly.length < 2 && !/^[A-Za-z]\.$/.test(token)) {
      continue;
    }
    if (lettersOnly.length < 2) continue;
    const titled = token
      .toLowerCase()
      .replace(/(^|[\-'])([\p{L}])/gu, (_, sep: string, letter: string) => `${sep}${letter.toUpperCase()}`);
    return titled;
  }
  return SOMEONE;
}

export function truncateProductHint(title: string, maxLen = 48): string {
  const t = title.replace(/\s+/g, " ").trim();
  if (t.length <= maxLen) return t;
  return `${t.slice(0, Math.max(0, maxLen - 1)).trim()}…`;
}

export function abbreviateRegion(_country?: string | null, state?: string | null): string {
  const st = state?.trim() ?? "";
  if (!st) return "";
  // Stored as 2-letter code (US states, provinces, …) — show uppercase.
  if (/^[A-Za-z]{2}$/.test(st)) return st.toUpperCase();
  // Full region names (“Texas”) — title-case; never synthesize a bogus 2-letter abbreviation.
  return st
    .split(/[\s.-]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}
