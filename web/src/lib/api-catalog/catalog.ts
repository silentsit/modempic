import { authMdOrigin } from "@/lib/auth/auth-md";

type LinkTarget = { href: string; type: string };

export type ApiCatalogLinksetEntry = {
  anchor: string;
  "service-desc": LinkTarget[];
  "service-doc": LinkTarget[];
  status?: LinkTarget[];
};

export function apiCatalogDocument(origin = authMdOrigin()) {
  const health = `${origin}/api/health`;
  const docs = `${origin}/docs/api`;
  return {
    linkset: [
      {
        anchor: health,
        "service-desc": [{ href: `${origin}/openapi/health.json`, type: "application/json" }],
        "service-doc": [{ href: `${docs}#health`, type: "text/markdown" }],
        status: [{ href: health, type: "application/json" }],
      },
      {
        anchor: `${origin}/api/auth`,
        "service-desc": [{ href: `${origin}/openapi/auth.json`, type: "application/json" }],
        "service-doc": [{ href: `${origin}/auth.md`, type: "text/markdown" }],
      },
      {
        anchor: `${origin}/api/cart/count`,
        "service-desc": [{ href: `${origin}/openapi/cart.json`, type: "application/json" }],
        "service-doc": [{ href: `${docs}#cart`, type: "text/markdown" }],
        status: [{ href: health, type: "application/json" }],
      },
    ] satisfies ApiCatalogLinksetEntry[],
  };
}

export function healthOpenApi(origin = authMdOrigin()) {
  return {
    openapi: "3.1.0",
    info: {
      title: "Modempic Health API",
      version: "1.0.0",
      description: "Liveness and payment-configuration snapshot for the Modempic storefront.",
    },
    servers: [{ url: origin }],
    paths: {
      "/api/health": {
        get: {
          summary: "Service health",
          operationId: "getHealth",
          responses: {
            "200": {
              description: "Health snapshot",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    required: ["ok", "service"],
                    properties: {
                      ok: { type: "boolean" },
                      service: { type: "string" },
                      db: {
                        type: "object",
                        properties: { reachable: { type: "boolean" } },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  };
}

export function authOpenApi(origin = authMdOrigin()) {
  return {
    openapi: "3.1.0",
    info: {
      title: "Modempic Auth API",
      version: "1.0.0",
      description:
        "NextAuth session endpoints for human customer accounts. Agents must not create accounts without explicit human consent. See /auth.md.",
    },
    servers: [{ url: origin }],
    paths: {
      "/api/auth/session": {
        get: {
          summary: "Current browser session",
          operationId: "getAuthSession",
          responses: {
            "200": {
              description: "Session JSON, or empty when signed out",
              content: { "application/json": { schema: { type: "object" } } },
            },
          },
        },
      },
      "/api/auth/providers": {
        get: {
          summary: "Configured NextAuth providers",
          operationId: "getAuthProviders",
          responses: {
            "200": {
              description: "Provider map",
              content: { "application/json": { schema: { type: "object" } } },
            },
          },
        },
      },
    },
  };
}

export function cartOpenApi(origin = authMdOrigin()) {
  return {
    openapi: "3.1.0",
    info: {
      title: "Modempic Cart API",
      version: "1.0.0",
      description: "Guest or signed-in cart item count for the storefront header.",
    },
    servers: [{ url: origin }],
    paths: {
      "/api/cart/count": {
        get: {
          summary: "Cart line count",
          operationId: "getCartCount",
          responses: {
            "200": {
              description: "Number of lines in the current cart",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    required: ["count"],
                    properties: { count: { type: "integer", minimum: 0 } },
                  },
                },
              },
            },
          },
        },
      },
    },
  };
}

export function renderApiDocs(origin = authMdOrigin()) {
  return `# Modempic API catalog

Public machine-readable APIs for this storefront, listed at ${origin}/.well-known/api-catalog ([RFC 9727](https://www.rfc-editor.org/rfc/rfc9727)).

Do not call webhooks, cron jobs, or admin routes. Payment webhooks are signed and private.

## Health {#health}

- Endpoint: \`GET ${origin}/api/health\`
- OpenAPI: ${origin}/openapi/health.json
- Returns database reachability and whether card/crypto checkout is configured. No secrets.

## Auth {#auth}

- Endpoint: \`${origin}/api/auth\` (NextAuth)
- OpenAPI: ${origin}/openapi/auth.json
- Human docs: ${origin}/auth.md
- OAuth discovery: ${origin}/.well-known/oauth-authorization-server
- OpenID configuration: ${origin}/.well-known/openid-configuration
- Session cookies for customer accounts. Agents must not register or sign in without the human's consent.

## Cart {#cart}

- Endpoint: \`GET ${origin}/api/cart/count\`
- OpenAPI: ${origin}/openapi/cart.json
- Returns \`{ "count": number }\` for the current guest or signed-in cart.
`;
}

export const API_CATALOG_CONTENT_TYPE =
  'application/linkset+json; profile="https://www.rfc-editor.org/info/rfc9727"';

export function apiCatalogHeaders() {
  return {
    "Content-Type": API_CATALOG_CONTENT_TYPE,
    Link: '</.well-known/api-catalog>; rel="api-catalog"',
    "Cache-Control": "public, max-age=0, s-maxage=3600, must-revalidate",
    "X-Robots-Tag": "noindex, follow",
    "Access-Control-Allow-Origin": "*",
  };
}
