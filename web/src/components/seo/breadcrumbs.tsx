import Link from "next/link";
import { getSiteUrl } from "@/lib/site-url";

export type Crumb = { label: string; href?: string };

/**
 * Visible breadcrumb trail with matching `BreadcrumbList` JSON-LD so search engines see the same hierarchy users do.
 * Pass an absolute or relative `href`; the JSON-LD is normalized to absolute.
 */
export function Breadcrumbs({ crumbs }: { crumbs: Crumb[] }) {
  if (crumbs.length === 0) return null;

  const root = getSiteUrl().replace(/\/$/, "");
  const itemListElement = crumbs.map((c, idx) => ({
    "@type": "ListItem" as const,
    position: idx + 1,
    name: c.label,
    item: c.href ? (c.href.startsWith("http") ? c.href : `${root}${c.href}`) : `${root}/`,
  }));
  const ld = { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement };

  return (
    <>
      <nav aria-label="Breadcrumb" className="text-sm text-[var(--muted-foreground)]">
        <ol className="flex flex-wrap gap-1">
          {crumbs.map((c, idx) => {
            const isLast = idx === crumbs.length - 1;
            return (
              <li key={`${c.label}-${idx}`} className="flex items-center gap-1">
                {idx > 0 ? <span aria-hidden>/</span> : null}
                {c.href && !isLast ? (
                  <Link href={c.href} className="hover:underline">
                    {c.label}
                  </Link>
                ) : (
                  <span className="text-[var(--foreground)]" aria-current={isLast ? "page" : undefined}>
                    {c.label}
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
    </>
  );
}
