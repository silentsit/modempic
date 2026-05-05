import Link from "next/link";

export type RelatedLink = { href: string; label: string; description?: string };

/**
 * Compact "see also" interlink block. Use at the end of static/legal/info pages to spread link equity
 * to high-value commercial and informational pages without disrupting body copy.
 */
export function RelatedLinks({
  heading = "Related on Modempic",
  links,
  className = "",
}: {
  heading?: string;
  links: RelatedLink[];
  className?: string;
}) {
  if (links.length === 0) return null;
  return (
    <aside
      className={`mt-12 rounded-xl border border-[var(--border)] bg-[var(--muted)]/40 p-6 ${className}`}
      aria-labelledby="related-heading"
    >
      <h2 id="related-heading" className="text-base font-semibold text-[var(--foreground)]">
        {heading}
      </h2>
      <ul className="mt-3 grid gap-3 sm:grid-cols-2">
        {links.map((l) => (
          <li key={l.href}>
            <Link
              href={l.href}
              className="block rounded-md border border-transparent px-3 py-2 transition-colors hover:border-[var(--border)] hover:bg-[var(--card)]"
            >
              <span className="font-medium text-[var(--foreground)]">{l.label}</span>
              {l.description ? (
                <span className="mt-0.5 block text-sm text-[var(--muted-foreground)]">{l.description}</span>
              ) : null}
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  );
}
