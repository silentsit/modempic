import { getSiteUrl } from "@/lib/site-url";

export function authMdOrigin(baseUrl = getSiteUrl()) {
  return baseUrl.replace(/\/$/, "");
}

/** Verified-email registration via the human signup form. No POST /agent/auth. */
export function agentAuthMetadata(origin = authMdOrigin()) {
  return {
    skill: `${origin}/auth.md`,
    register_uri: `${origin}/register`,
    claim_uri: `${origin}/register`,
    identity_types_supported: ["identity_assertion"] as const,
    identity_assertion: {
      assertion_types_supported: ["verified_email"] as const,
      credential_types_supported: ["session_cookie"] as const,
    },
  };
}

export function protectedResourceMetadata(origin = authMdOrigin()) {
  return {
    resource: `${origin}/`,
    resource_name: "Modempic",
    resource_logo_uri: `${origin}/modempic-logo.svg`,
    authorization_servers: [origin],
    scopes_supported: ["account.read", "orders.read"],
    bearer_methods_supported: ["header"] as const,
    resource_documentation: `${origin}/auth.md`,
    resource_policy_uri: `${origin}/privacy-policy`,
    resource_tos_uri: `${origin}/terms-of-service`,
    agent_auth: agentAuthMetadata(origin),
  };
}

export function authorizationServerMetadata(origin = authMdOrigin()) {
  const prm = protectedResourceMetadata(origin);
  return {
    issuer: origin,
    authorization_endpoint: `${origin}/login`,
    service_documentation: `${origin}/auth.md`,
    authorization_servers: prm.authorization_servers,
    resource: prm.resource,
    scopes_supported: prm.scopes_supported,
    bearer_methods_supported: prm.bearer_methods_supported,
    agent_auth: prm.agent_auth,
  };
}

export function renderAuthMd(origin = authMdOrigin()) {
  const prm = `${origin}/.well-known/oauth-protected-resource`;
  const as = `${origin}/.well-known/oauth-authorization-server`;
  return `# auth.md

You are an agent helping a human shop at Modempic. This is a customer storefront, not an OAuth resource server for autonomous agents. Do not create accounts, place orders, or POST registration payloads without the human's explicit consent.

## Audience

Shopping assistants acting for a person who is 18 or older. Guest checkout works without an account. An account is optional and is for tracking orders.

## Discovery

1. GET \`${prm}\`
2. GET \`${as}\` — \`issuer\` matches \`authorization_servers[0]\`

Protected Resource Metadata lists \`resource\`, \`authorization_servers\`, \`scopes_supported\`, and \`bearer_methods_supported\` (\`header\`). Authorization Server metadata includes \`issuer\` and the \`agent_auth\` block. There is no token endpoint, JWKS, or OpenID configuration — this storefront uses NextAuth session cookies, not bearer tokens.

## Registration

Humans provision accounts in the browser. \`agent_auth.register_uri\` is the HTML signup form:

- Register: ${origin}/register (email, password, 18+ confirmation, terms)
- Sign in: ${origin}/login
- Session: NextAuth at ${origin}/api/auth (email/password; Google and other social providers when configured)

There is no \`POST /agent/auth\` and no ID-JAG exchange. Do not probe registration with automated POSTs.

## Supported method

**verified_email** — the human registers with their email at \`/register\`. The credential is a NextAuth session cookie in the browser, not an \`Authorization: Bearer\` access token. \`claim_uri\` is the same form: the human completes signup there.

## Credential use

After sign-in, the browser sends the session cookie to account and order pages. Storefront APIs are not a public bearer-token API. Scopes \`account.read\` and \`orders.read\` describe what a signed-in customer can see in their account; they are not OAuth token scopes issued to agents.
`;
}

export function authMarkdownResponse(body: string) {
  return new Response(body, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=3600, must-revalidate",
      "X-Robots-Tag": "noindex, follow",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

export function authJsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=3600, must-revalidate",
      "X-Robots-Tag": "noindex, follow",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

export function authCorsOptionsResponse(methods = "GET, HEAD, OPTIONS") {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": methods,
      "Access-Control-Allow-Headers": "Accept, Content-Type, Authorization",
      "Access-Control-Max-Age": "86400",
    },
  });
}
