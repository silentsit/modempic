import { SafeLink } from "@/components/site/safe-link";

export function ProductInternalLinks({
  categoryHref,
  categoryLabel,
  hasCatalogDocumentation,
}: {
  categoryHref: string | null;
  categoryLabel: string | null;
  hasCatalogDocumentation: boolean;
}) {
  const links: { href: string; label: string }[] = [];

  if (categoryHref && categoryLabel) {
    links.push({ href: categoryHref, label: `More in ${categoryLabel}` });
  }
  if (hasCatalogDocumentation) {
    links.push({ href: "#documentation", label: "Product documentation" });
  }
  links.push({ href: "#reviews", label: "Customer reviews" });

  return (
    <nav aria-label="Related product resources" className="mt-6">
      <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[var(--muted-foreground)]">Explore</p>
      <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-sm">
        {links.map((link) => (
          <li key={link.href}>
            <SafeLink
              href={link.href}
              className="text-[var(--primary)] underline-offset-2 hover:underline"
            >
              {link.label}
            </SafeLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
