/** RFC 8288 / RFC 9727 §3 discovery links advertised on the homepage. */
export const HOMEPAGE_AGENT_DISCOVERY_LINKS = [
  '</.well-known/api-catalog>; rel="api-catalog"; type="application/linkset+json"',
  '</openapi/health.json>; rel="service-desc"; type="application/json"',
  '</docs/api>; rel="service-doc"; type="text/markdown"',
  '</llms.txt>; rel="describedby"; type="text/markdown"',
] as const;

export const HOMEPAGE_AGENT_DISCOVERY_RELS = [
  "api-catalog",
  "service-desc",
  "service-doc",
  "describedby",
] as const;

export function homepageAgentDiscoveryLinkHeader() {
  return HOMEPAGE_AGENT_DISCOVERY_LINKS.join(", ");
}

export function isHomepagePath(pathname: string) {
  return pathname === "/" || pathname === "";
}

export function applyHomepageLinkHeaders(headers: Headers, pathname: string) {
  if (!isHomepagePath(pathname)) return;
  const existing = headers.get("Link") ?? "";
  if (existing.includes('rel="api-catalog"')) return;
  headers.append("Link", homepageAgentDiscoveryLinkHeader());
}
