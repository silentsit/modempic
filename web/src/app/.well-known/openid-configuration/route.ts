import {
  authCorsOptionsResponse,
  authJsonResponse,
  authorizationServerMetadata,
} from "@/lib/auth/auth-md";

export const revalidate = 3600;

export function GET() {
  return authJsonResponse(authorizationServerMetadata());
}

export function HEAD() {
  return new Response(null, {
    status: 200,
    headers: authJsonResponse(authorizationServerMetadata()).headers,
  });
}

export function OPTIONS() {
  return authCorsOptionsResponse();
}
