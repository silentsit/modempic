import { getPublishedPosts } from "@/lib/data/blog";
import { getPublishedProducts, listCategories } from "@/lib/data/products";
import {
  groupProductsByCategory,
  type HtmlSitemapLink,
  type HtmlSitemapProductGroup,
} from "./html-sitemap-groups";

export type { HtmlSitemapLink, HtmlSitemapProductGroup };
export { groupProductsByCategory };

export type HtmlSitemapData = {
  pages: HtmlSitemapLink[];
  categories: HtmlSitemapLink[];
  productGroups: HtmlSitemapProductGroup[];
  posts: HtmlSitemapLink[];
};

/** Public static pages shown on the HTML sitemap. Add new storefront pages here. */
export const HTML_SITEMAP_PAGES: HtmlSitemapLink[] = [
  { href: "/", label: "Home" },
  { href: "/shop", label: "Shop" },
  { href: "/shop/best-sellers", label: "Best Sellers" },
  { href: "/about", label: "About" },
  { href: "/blog", label: "Blog" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact" },
  { href: "/how-to-pay", label: "How to Pay" },
  { href: "/shipping", label: "Shipping" },
  { href: "/refund-policy", label: "Return & Refund Policy" },
  { href: "/privacy-policy", label: "Privacy Policy" },
  { href: "/terms-of-service", label: "Terms of Service" },
  { href: "/sitemap", label: "Sitemap" },
];

/** Live HTML sitemap: static pages plus current published categories, products, and posts. */
export async function getHtmlSitemapData(): Promise<HtmlSitemapData> {
  const [categories, products, posts] = await Promise.all([
    listCategories(),
    getPublishedProducts(),
    getPublishedPosts(),
  ]);

  return {
    pages: HTML_SITEMAP_PAGES,
    categories: [
      { href: "/shop", label: "All products" },
      ...categories.map((category) => ({ href: `/shop/${category.slug}`, label: category.name })),
    ],
    productGroups: groupProductsByCategory(categories, products),
    posts: posts.map((post) => ({ href: `/blog/${post.slug}`, label: post.title })),
  };
}
