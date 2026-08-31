import {
  authCorsOptionsResponse,
  authJsonResponse,
  protectedResourceMetadata,
} from "@/lib/auth/auth-md";

export const revalidate = 3600;

export function GET() {
  return authJsonResponse(protectedResourceMetadata());
}

export function HEAD() {
  return new Response(null, { status: 200, headers: authJsonResponse(protectedResourceMetadata()).headers });
}

export function OPTIONS() {
  return authCorsOptionsResponse();
}
