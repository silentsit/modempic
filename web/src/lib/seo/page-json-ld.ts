export function siteGraphIds(baseUrl: string) {
  const root = baseUrl.replace(/\/$/, "");
  return {
    root,
    organizationId: `${root}/#organization`,
    websiteId: `${root}/#website`,
  };
}

export function absolutePageUrl(baseUrl: string, path: string) {
  const root = baseUrl.replace(/\/$/, "");
  if (!path || path === "/") return root;
  return `${root}${path.startsWith("/") ? path : `/${path}`}`;
}

/** Visible header mark. PNG so Google can fetch a raster logo. */
export function organizationLogo(baseUrl: string) {
  const root = baseUrl.replace(/\/$/, "");
  return {
    "@type": "ImageObject" as const,
    url: `${root}/modempic-logo.png`,
    width: 480,
    height: 120,
  };
}

type InformationalPageType = "WebPage" | "AboutPage" | "ContactPage";

export function buildWebPageJsonLd({
  type = "WebPage",
  name,
  description,
  path,
  baseUrl,
  about,
}: {
  type?: InformationalPageType;
  name: string;
  description: string;
  path: string;
  baseUrl: string;
  about?: Record<string, unknown>;
}) {
  const { websiteId, organizationId } = siteGraphIds(baseUrl);
  const url = absolutePageUrl(baseUrl, path);
  return {
    "@context": "https://schema.org" as const,
    "@type": type,
    "@id": url,
    url,
    name,
    description,
    inLanguage: "en",
    isPartOf: { "@id": websiteId },
    publisher: { "@id": organizationId },
    ...(about ? { about } : {}),
  };
}

export const ORGANIZATION_SUPPORT_EMAIL = "info@modempic.com";

export function buildContactPageJsonLd({
  name,
  description,
  baseUrl,
}: {
  name: string;
  description: string;
  baseUrl: string;
}) {
  const page = buildWebPageJsonLd({
    type: "ContactPage",
    name,
    description,
    path: "/contact",
    baseUrl,
  });
  return {
    ...page,
    mainEntity: {
      "@type": "ContactPoint" as const,
      contactType: "customer support",
      email: ORGANIZATION_SUPPORT_EMAIL,
      url: page.url,
    },
  };
}

export function buildBlogPostingJsonLd({
  title,
  description,
  slug,
  imageUrl,
  datePublished,
  dateModified,
  authorName,
  articleSection,
  baseUrl,
}: {
  title: string;
  description?: string | null;
  slug: string;
  imageUrl?: string | null;
  datePublished?: string | null;
  dateModified: string;
  authorName?: string | null;
  articleSection?: string | null;
  baseUrl: string;
}) {
  const { root, organizationId, websiteId } = siteGraphIds(baseUrl);
  const url = `${root}/blog/${slug}`;
  const author =
    authorName && authorName.trim() && authorName.trim().toLowerCase() !== "modempic"
      ? { "@type": "Person" as const, name: authorName.trim() }
      : { "@id": organizationId, "@type": "Organization" as const, name: "Modempic" };
  return {
    "@context": "https://schema.org" as const,
    "@type": "BlogPosting" as const,
    "@id": `${url}#article`,
    url,
    headline: title,
    inLanguage: "en",
    ...(description ? { description } : {}),
    ...(imageUrl ? { image: [imageUrl] } : {}),
    ...(datePublished ? { datePublished } : {}),
    dateModified,
    author,
    ...(articleSection ? { articleSection } : {}),
    mainEntityOfPage: { "@type": "WebPage" as const, "@id": url },
    isPartOf: { "@id": websiteId },
    publisher: {
      "@id": organizationId,
      "@type": "Organization" as const,
      name: "Modempic",
      url: root,
      logo: organizationLogo(root),
    },
  };
}
