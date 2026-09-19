import { authMdOrigin } from "@/lib/auth/auth-md";
import { STOREFRONT_CATEGORIES } from "@/lib/catalog/storefront-categories";
import { comparePath } from "@/lib/compare/compare-keys";
import { SHIPPING_COUNTRIES } from "@/content/shipping/country-pages";
import { COMPARE_NAV_PAIRS, shortCompareNavLabel } from "@/data/site-navigation";

export type LlmsTxtProductLink = {
  slug: string;
  name: string;
};

export type LlmsTxtOptions = {
  featuredProducts?: LlmsTxtProductLink[];
};

function llmsLink(origin: string, path: string, label: string) {
  return `- ${label}: ${origin}${path}`;
}

function shippingCountryLabel(countryName: string) {
  return countryName.replace(/^the /i, "");
}

function renderCategorySection(origin: string) {
  const lines = STOREFRONT_CATEGORIES.map((category) =>
    llmsLink(origin, `/shop/${category.slug}`, category.name),
  );
  lines.push(llmsLink(origin, "/shop/best-sellers", "Best sellers"));
  return lines.join("\n");
}

function renderFeaturedProductsSection(origin: string, featuredProducts: LlmsTxtProductLink[]) {
  const lines = [llmsLink(origin, "/shop/best-sellers", "Best sellers (full list)")];
  for (const product of featuredProducts) {
    lines.push(llmsLink(origin, `/product/${product.slug}`, product.name));
  }
  return lines.join("\n");
}

function renderCompareSection(origin: string) {
  const lines = [
    llmsLink(origin, "/modafinil-price-comparison", "Modafinil price comparison table"),
    llmsLink(origin, "/modafinil-price-comparison.csv", "Modafinil price comparison CSV"),
    llmsLink(origin, "/where-to-buy-modafinil-online", "Where to buy Modafinil online"),
    llmsLink(origin, "/buy-modafinil-reddit", "Buy Modafinil Reddit"),
    ...COMPARE_NAV_PAIRS.map(([left, right]) =>
      llmsLink(origin, comparePath(left, right), shortCompareNavLabel(left, right)),
    ),
  ];
  return lines.join("\n");
}

function renderShippingSection(origin: string) {
  const lines = [
    llmsLink(origin, "/shipping", "Worldwide shipping overview"),
    ...SHIPPING_COUNTRIES.map((country) =>
      llmsLink(origin, `/shipping/${country.slug}`, shippingCountryLabel(country.countryName)),
    ),
  ];
  return lines.join("\n");
}

export function renderLlmsTxt(origin = authMdOrigin(), options: LlmsTxtOptions = {}) {
  const featuredProducts = options.featuredProducts ?? [];

  return `# Modempic

Modempic is a customer storefront for hard-to-find medicines. Pack sizes and prices are on the product pages. Checkout accepts debit/credit card via CardToUSDT or cryptocurrency via Paymento.

This site is not medical advice and is not a substitute for a prescriber. Do not create accounts or place orders without the human's explicit consent.

## Shop

- Catalog: ${origin}/shop
- How to pay: ${origin}/how-to-pay
- FAQ: ${origin}/faq

## Categories

${renderCategorySection(origin)}

## Featured products

${renderFeaturedProductsSection(origin, featuredProducts)}

## Compare and pricing

${renderCompareSection(origin)}

## Shipping by destination

${renderShippingSection(origin)}

## Guides and support

- About: ${origin}/about
- Blog: ${origin}/blog
- Contact: ${origin}/contact
- HTML sitemap: ${origin}/sitemap

## Machine-readable discovery

- Sitemap: ${origin}/sitemap.xml

## Policies

- Privacy: ${origin}/privacy-policy
- Terms: ${origin}/terms-of-service
- Refunds: ${origin}/refund-policy
- Shipping policy: ${origin}/shipping
`;
}
