import {
  getSitemapIndexEntries,
  renderSitemapIndex,
  sitemapXmlResponse,
  stylesheetHref,
} from "@/lib/seo/sitemaps";

export const revalidate = 3600;

export async function GET() {
  const entries = await getSitemapIndexEntries();
  return sitemapXmlResponse(renderSitemapIndex(entries, stylesheetHref()));
}
