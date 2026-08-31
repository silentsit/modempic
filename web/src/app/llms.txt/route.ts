import { authMarkdownResponse } from "@/lib/auth/auth-md";
import { renderLlmsTxt } from "@/lib/api-catalog/llms-txt";

export const revalidate = 3600;

export function GET() {
  return authMarkdownResponse(renderLlmsTxt());
}
