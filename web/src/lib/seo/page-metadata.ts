import type { Metadata } from "next";

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
  const ogTitle = `${title} | Modempic`;

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
