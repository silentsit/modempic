import type { Metadata } from "next";
import { titleCaseHeading } from "@/lib/text/heading-title-case";

const BRAND_TITLE_SUFFIX = /\s*[|–—-]\s*Modempic\s*$/i;

/** CMS titles often already include `| Modempic`; the root layout template adds it again. */
export function stripBrandTitleSuffix(title: string): string {
  return title.replace(BRAND_TITLE_SUFFIX, "").replace(/\s+/g, " ").trim();
}

/** Document title slot for the `%s | Modempic` layout template. */
export function pageDocumentTitle(title: string): string {
  return titleCaseHeading(stripBrandTitleSuffix(title));
}

/** Open Graph / Twitter title with the brand suffix applied once. */
export function pageShareTitle(title: string): string {
  const cleaned = pageDocumentTitle(title);
  return cleaned ? `${cleaned} | Modempic` : "Modempic";
}

/** Shared Open Graph + Twitter metadata for static indexable pages. */
export function pageSocialMetadata({
  title,
  description,
  path,
}: {
  title: string;
  description: string;
  path: string;
}): Pick<Metadata, "openGraph" | "twitter"> {
  const ogTitle = pageShareTitle(title);

  return {
    openGraph: {
      title: ogTitle,
      description,
      url: path,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description,
    },
  };
}
