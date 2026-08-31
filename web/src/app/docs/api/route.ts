import { authMarkdownResponse } from "@/lib/auth/auth-md";
import { renderApiDocs } from "@/lib/api-catalog/catalog";

export const revalidate = 3600;

export function GET() {
  return authMarkdownResponse(renderApiDocs());
}
