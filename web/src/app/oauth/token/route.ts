import { authCorsOptionsResponse, authJsonResponse, oauthTokenError } from "@/lib/auth/auth-md";

export const dynamic = "force-dynamic";

const NO_AGENT_TOKENS =
  "Modempic does not issue OAuth access tokens to agents. Humans sign in at /login. See /auth.md.";

export function POST() {
  return authJsonResponse(oauthTokenError(NO_AGENT_TOKENS), 400);
}

export function GET() {
  return authJsonResponse(oauthTokenError(NO_AGENT_TOKENS, "invalid_request"), 405);
}

export function OPTIONS() {
  return authCorsOptionsResponse("POST, OPTIONS");
}
