import {
  getCompareSitemapUrls,
  renderUrlset,
  sitemapXmlResponse,
  stylesheetHref,
} from "@/lib/seo/sitemaps";

export const revalidate = 3600;

export async function GET() {
  try {
    const urls = await getCompareSitemapUrls();
    return sitemapXmlResponse(renderUrlset(urls, stylesheetHref()));
  } catch {
    return sitemapXmlResponse(renderUrlset([], stylesheetHref()));
  }
}
