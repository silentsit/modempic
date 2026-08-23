export type HtmlSitemapLink = {
  href: string;
  label: string;
};

export type HtmlSitemapProductGroup = {
  name: string;
  href: string;
  products: HtmlSitemapLink[];
};

export function groupProductsByCategory(
  categories: Array<{ name: string; slug: string }>,
  products: Array<{
    name: string;
    slug: string;
    categories: Array<{ category: { slug: string } }>;
  }>,
): HtmlSitemapProductGroup[] {
  const groups = categories.map((category) => ({
    name: category.name,
    href: `/shop/${category.slug}`,
    products: products
      .filter((product) => product.categories.some((row) => row.category.slug === category.slug))
      .map((product) => ({ href: `/product/${product.slug}`, label: product.name }))
      .sort((a, b) => a.label.localeCompare(b.label)),
  }));

  const assigned = new Set(groups.flatMap((group) => group.products.map((product) => product.href)));
  const leftover = products
    .filter((product) => !assigned.has(`/product/${product.slug}`))
    .map((product) => ({ href: `/product/${product.slug}`, label: product.name }))
    .sort((a, b) => a.label.localeCompare(b.label));

  const visible = groups.filter((group) => group.products.length > 0);
  if (leftover.length > 0) {
    visible.push({ name: "Other", href: "/shop", products: leftover });
  }
  return visible;
}
