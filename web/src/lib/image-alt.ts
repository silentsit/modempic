/** Last-resort alt when a filename cannot be turned into readable text. */
export const PRODUCT_IMAGE_ALT_FALLBACK = "Product image";
export const ARTICLE_IMAGE_ALT_FALLBACK = "Article image";

function pathnameFromSrc(src: string): string {
  const trimmed = src.trim();
  try {
    if (/^https?:\/\//i.test(trimmed)) return new URL(trimmed).pathname;
  } catch {
    /* fall through */
  }
  return trimmed.split("?")[0].split("#")[0];
}

function looksLikeOpaqueId(value: string): boolean {
  const compact = value.replace(/[\s_-]/g, "");
  if (/^v?\d+$/i.test(compact)) return true;
  if (/^[a-f0-9]{16,}$/i.test(compact)) return true;
  return false;
}

/**
 * Build a short descriptive alt from an image URL or path.
 * Used only when the source HTML/CMS did not supply one.
 */
export function altFromImageSrc(
  src: string | undefined | null,
  fallback = PRODUCT_IMAGE_ALT_FALLBACK,
): string {
  if (!src || typeof src !== "string") return fallback;
  const trimmed = src.trim();
  if (!trimmed || trimmed.startsWith("data:")) return fallback;

  const file = pathnameFromSrc(trimmed).split("/").filter(Boolean).pop() ?? "";
  const base = file.replace(/\.[a-z0-9]{1,8}$/i, "");
  let decoded = base;
  try {
    decoded = decodeURIComponent(base);
  } catch {
    decoded = base;
  }

  const cleaned = decoded.replace(/[_+]+/g, " ").replace(/-+/g, " ").replace(/\s+/g, " ").trim();
  if (!cleaned || cleaned.length < 2 || looksLikeOpaqueId(cleaned)) return fallback;

  return cleaned.replace(/\b([a-z])/g, (ch) => ch.toUpperCase());
}

export function resolvedImageAlt(
  existing: string | null | undefined,
  src: string | null | undefined,
  fallback = PRODUCT_IMAGE_ALT_FALLBACK,
): string {
  const trimmed = existing?.trim();
  if (trimmed) return trimmed;
  return altFromImageSrc(src, fallback);
}

/** Drop stuffed “Buy … Online” alts in favor of the product name. */
export function destuffProductImageAlt(alt: string | null | undefined, productName: string): string {
  const raw = alt?.trim();
  if (!raw) return productName;
  if (/^buy\s+/i.test(raw)) return productName;
  return raw;
}
