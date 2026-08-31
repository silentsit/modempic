import { authCorsOptionsResponse, authJsonResponse, jwksDocument } from "@/lib/auth/auth-md";

export const revalidate = 3600;

export function GET() {
  return authJsonResponse(jwksDocument());
}

export function HEAD() {
  return new Response(null, { status: 200, headers: authJsonResponse(jwksDocument()).headers });
}

export function OPTIONS() {
  return authCorsOptionsResponse();
}
