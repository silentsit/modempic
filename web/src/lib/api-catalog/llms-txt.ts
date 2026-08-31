import { authMdOrigin } from "@/lib/auth/auth-md";

export function renderLlmsTxt(origin = authMdOrigin()) {
  return `# Modempic

Modempic is a customer storefront for hard-to-find medicines. Pack sizes and prices are on the product pages. Checkout accepts card or crypto.

This site is not medical advice and is not a substitute for a prescriber. Do not create accounts or place orders without the human's explicit consent.

## Shop

- Catalog: ${origin}/shop
- Best sellers: ${origin}/shop/best-sellers
- How to pay: ${origin}/how-to-pay
- FAQ: ${origin}/faq

## Machine-readable discovery

- API catalog (RFC 9727): ${origin}/.well-known/api-catalog
- API docs: ${origin}/docs/api
- OAuth discovery (RFC 8414): ${origin}/.well-known/oauth-authorization-server
- OpenID configuration: ${origin}/.well-known/openid-configuration
- Auth for agents: ${origin}/auth.md
- Sitemap: ${origin}/sitemap.xml

## Policies

- Privacy: ${origin}/privacy-policy
- Terms: ${origin}/terms-of-service
- Refunds: ${origin}/refund-policy
- Shipping: ${origin}/shipping
`;
}
