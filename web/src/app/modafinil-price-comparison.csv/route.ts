import { PRICE_INDEX_EDITION, priceIndexCsv, priceIndexCsvFilename } from "@/lib/compare/price-index";

export const revalidate = 3600;

export function GET() {
  const body = priceIndexCsv(PRICE_INDEX_EDITION);
  return new Response(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${priceIndexCsvFilename(PRICE_INDEX_EDITION)}"`,
      "Cache-Control": "public, max-age=0, s-maxage=3600, must-revalidate",
    },
  });
}
