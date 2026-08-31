import { apiCatalogDocument, apiCatalogHeaders } from "@/lib/api-catalog/catalog";

export const revalidate = 3600;

export function GET() {
  return new Response(JSON.stringify(apiCatalogDocument()), {
    status: 200,
    headers: apiCatalogHeaders(),
  });
}

export function HEAD() {
  return new Response(null, {
    status: 200,
    headers: apiCatalogHeaders(),
  });
}
