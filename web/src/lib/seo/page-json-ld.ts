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

type InformationalPageType = "WebPage" | "AboutPage" | "ContactPage";

export function buildWebPageJsonLd({
  type = "WebPage",
  name,
  description,
  path,
  baseUrl,
}: {
  type?: InformationalPageType;
  name: string;
  description: string;
  path: string;
  baseUrl: string;
}) {
  const { websiteId } = siteGraphIds(baseUrl);
  const url = absolutePageUrl(baseUrl, path);
  return {
    "@context": "https://schema.org" as const,
    "@type": type,
    "@id": url,
    url,
    name,
    description,
    isPartOf: { "@id": websiteId },
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
  const { root, organizationId } = siteGraphIds(baseUrl);
  const url = `${root}/blog/${slug}`;
  return {
    "@context": "https://schema.org" as const,
    "@type": "BlogPosting" as const,
    "@id": `${url}#article`,
    url,
    headline: title,
    ...(description ? { description } : {}),
    ...(imageUrl ? { image: [imageUrl] } : {}),
    ...(datePublished ? { datePublished } : {}),
    dateModified,
    ...(authorName ? { author: { "@type": "Person" as const, name: authorName } } : {}),
    ...(articleSection ? { articleSection } : {}),
    mainEntityOfPage: { "@type": "WebPage" as const, "@id": url },
    publisher: {
      "@id": organizationId,
      "@type": "Organization" as const,
      name: "Modempic",
      url: root,
      logo: { "@type": "ImageObject" as const, url: `${root}/modempic-logo.png` },
    },
  };
}
