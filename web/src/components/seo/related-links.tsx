import Link from "next/link";
import { cn } from "@/lib/utils";
import { titleCaseHeading } from "@/lib/text/heading-title-case";

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
function headingDomId(heading: string) {
  const slug = heading
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return `${slug || "related"}-heading`;
}

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
  const headingId = headingDomId(heading);

  return (
    <aside
      className={cn("mt-12 rounded-2xl border border-border bg-muted/40 p-6", className)}
      aria-labelledby={headingId}
    >
      <h2 id={headingId} className="text-base font-semibold text-foreground">
        {titleCaseHeading(heading)}
      </h2>
      {hasImages ? (
        <ul className="mt-4 grid list-none gap-4 grid-cols-1 md:grid-cols-3">
          {links.map((l) => (
            <li key={l.href} className="list-none">
              <Link
                href={l.href}
                className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card transition-colors hover:border-primary/40"
              >
                <span className="relative block aspect-[16/10] overflow-hidden bg-muted">
                  {l.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element -- local /related assets and blog paths under /public
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
                    <span className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
                      {l.label}
                    </span>
                  )}
                </span>
                <span className="flex flex-1 flex-col p-4">
                  <span className="font-medium leading-snug text-foreground transition-colors group-hover:text-primary">
                    {l.label}
                  </span>
                  {l.description ? (
                    <span className="mt-1 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
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
                className="block rounded-xl border border-transparent px-3 py-2 transition-colors hover:border-border hover:bg-card"
              >
                <span className="font-medium text-foreground">{l.label}</span>
                {l.description ? (
                  <span className="mt-0.5 block text-sm text-muted-foreground">{l.description}</span>
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}
