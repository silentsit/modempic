import Link from "next/link";
import { cn } from "@/lib/utils";

export type RelatedLink = {
  href: string;
  label: string;
  description?: string;
  imageUrl?: string;
  imageAlt?: string;
};

/**
 * Compact "see also" interlink block. Use at the end of static/legal/info pages to spread link equity
 * to high-value commercial and informational pages without disrupting body copy.
 *
 * Pass `imageUrl` on links for thumbnail cards (blog suggestions, shop categories).
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

  const hasImages = links.some((l) => l.imageUrl);

  return (
    <aside
      className={cn("mt-12 rounded-xl border border-[var(--border)] bg-[var(--muted)]/40 p-6", className)}
      aria-labelledby="related-heading"
    >
      <h2 id="related-heading" className="text-base font-semibold text-[var(--foreground)]">
        {heading}
      </h2>
      {hasImages ? (
        <ul className="mt-4 grid list-none gap-4 sm:grid-cols-2">
          {links.map((l) => (
            <li key={l.href} className="list-none">
              <Link
                href={l.href}
                className="group flex h-full flex-col overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--card)] shadow-sm transition-shadow hover:shadow-md"
              >
                <span className="relative block aspect-[16/10] overflow-hidden bg-[var(--muted)]">
                  {l.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element -- local /related SVGs and blog paths under /public
                    <img
                      src={l.imageUrl}
                      alt={l.imageAlt ?? ""}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                      loading="lazy"
                      decoding="async"
                      width={640}
                      height={400}
                    />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center text-sm text-[var(--muted-foreground)]">
                      {l.label}
                    </span>
                  )}
                </span>
                <span className="flex flex-1 flex-col p-4">
                  <span className="font-medium leading-snug text-[var(--foreground)] group-hover:underline">
                    {l.label}
                  </span>
                  {l.description ? (
                    <span className="mt-1 line-clamp-3 text-sm leading-relaxed text-[var(--muted-foreground)]">
                      {l.description}
                    </span>
                  ) : null}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
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
      )}
    </aside>
  );
}
