const CLOUDINARY_HOST = "res.cloudinary.com";
const UPLOAD_MARKER = "/upload/";

/** Width presets tuned for layout + LCP (Cloudinary `f_auto`, `q_auto`, `c_limit`). */
const WIDTH_BY_CONTEXT = {
  card: 640,
  cartThumb: 160,
  checkoutThumb: 160,
  galleryMain: 1600,
  galleryThumb: 280,
  adminThumb: 96,
  /** Structured data / sharing — keep a single solid size for crawlers. */
  jsonLd: 1200,
  openGraph: 1200,
} as const;

export type ProductImageDeliveryContext = keyof typeof WIDTH_BY_CONTEXT;

function isCloudinaryDeliveryUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.hostname === CLOUDINARY_HOST && u.pathname.includes("/upload/");
  } catch {
    return false;
  }
}

/**
 * Insert transformation segment after `/upload/` for Cloudinary delivery URLs.
 * No-op for non-Cloudinary URLs (local `/imported-products/…`, hotlinks, etc.).
 */
export function withCloudinaryDeliveryTransforms(
  url: string,
  opts: { width: number },
): string {
  if (!url || !isCloudinaryDeliveryUrl(url)) return url;

  const idx = url.indexOf(UPLOAD_MARKER);
  if (idx === -1) return url;

  const afterUpload = url.slice(idx + UPLOAD_MARKER.length);
  const firstSeg = afterUpload.split("/")[0] ?? "";
  if (firstSeg.includes("f_auto") && firstSeg.includes("q_auto")) {
    return url;
  }

  const transforms = `w_${opts.width},c_limit,f_auto,q_auto`;
  return `${url.slice(0, idx + UPLOAD_MARKER.length)}${transforms}/${afterUpload}`;
}

export function productImageDeliveryUrl(
  url: string | null | undefined,
  context: ProductImageDeliveryContext,
): string {
  if (!url) return "";
  const w = WIDTH_BY_CONTEXT[context];
  return withCloudinaryDeliveryTransforms(url, { width: w });
}

/** Absolute URL for metadata / JSON-LD (Cloudinary gets transforms; relative paths join `siteOrigin`). */
export function absoluteProductImageUrl(url: string, siteOrigin: string): string {
  const delivered = productImageDeliveryUrl(url, "openGraph");
  if (delivered.startsWith("http://") || delivered.startsWith("https://")) return delivered;
  const root = siteOrigin.replace(/\/$/, "");
  const path = delivered.startsWith("/") ? delivered : `/${delivered}`;
  return `${root}${path}`;
}
