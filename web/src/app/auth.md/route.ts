import { authMarkdownResponse, renderAuthMd } from "@/lib/auth/auth-md";

export const revalidate = 3600;

export function GET() {
  return authMarkdownResponse(renderAuthMd());
}

export function HEAD() {
  return authMarkdownResponse("");
}
