export type SitemapImage = { loc: string; title?: string };
export type SitemapUrl = { loc: string; lastmod?: Date; images?: SitemapImage[] };
export type SitemapIndexEntry = { loc: string; lastmod?: Date };

export function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

/** Canonical sitemap loc — homepage matches metadata (`https://modempic.com`, no trailing slash). */
export function staticPageLoc(base: string, path: string) {
  const origin = base.replace(/\/$/, "");
  if (!path) return origin;
  return `${origin}${path.startsWith("/") ? path : `/${path}`}`;
}

export function toAbsoluteUrl(pathOrUrl: string, base: string) {
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  const path = pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`;
  return `${base}${path}`;
}

function formatLastmod(date: Date) {
  return date.toISOString();
}

export function renderSitemapIndex(entries: SitemapIndexEntry[], stylesheetHref: string) {
  const body = entries
    .map(
      (entry) => {
        const lastmod = entry.lastmod
          ? `
		<lastmod>${formatLastmod(entry.lastmod)}</lastmod>`
          : "";
        return `	<sitemap>
		<loc>${escapeXml(entry.loc)}</loc>${lastmod}
	</sitemap>`;
      },
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?><?xml-stylesheet type="text/xsl" href="${escapeXml(stylesheetHref)}"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</sitemapindex>
`;
}

export function renderUrlset(urls: SitemapUrl[], stylesheetHref: string) {
  const body = urls
    .map((url) => {
      const images = (url.images ?? [])
        .map((image) => {
          const title = image.title
            ? `
			<image:title>${escapeXml(image.title)}</image:title>`
            : "";
          return `		<image:image>
			<image:loc>${escapeXml(image.loc)}</image:loc>${title}
		</image:image>`;
        })
        .join("\n");
      const imageBlock = images ? `\n${images}` : "";
      const lastmod = url.lastmod
        ? `
		<lastmod>${formatLastmod(url.lastmod)}</lastmod>`
        : "";
      return `	<url>
		<loc>${escapeXml(url.loc)}</loc>${lastmod}${imageBlock}
	</url>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?><?xml-stylesheet type="text/xsl" href="${escapeXml(stylesheetHref)}"?>
<urlset xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1" xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9 http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd http://www.google.com/schemas/sitemap-image/1.1 http://www.google.com/schemas/sitemap-image/1.1/sitemap-image.xsd" xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</urlset>
`;
}

export function sitemapXmlResponse(xml: string) {
  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=3600, must-revalidate",
    },
  });
}
