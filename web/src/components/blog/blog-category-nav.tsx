import Link from "next/link";

export function BlogCategoryNav({
  categories,
  activeCategory,
}: {
  categories: string[];
  activeCategory?: string;
}) {
  return (
    <nav aria-label="Article categories" className="mt-8 flex flex-wrap gap-2 border-b border-[var(--border)] pb-4">
      <CategoryPill label="All" href="/blog" active={!activeCategory} />
      {categories.map((c) => (
        <CategoryPill
          key={c}
          label={c}
          href={`/blog?cat=${encodeURIComponent(c)}`}
          active={activeCategory === c}
        />
      ))}
    </nav>
  );
}

function CategoryPill({ label, href, active }: { label: string; href: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={
        active
          ? "rounded-full bg-emerald-700 px-4 py-1.5 text-sm font-semibold text-white dark:bg-emerald-600"
          : "rounded-full border border-[var(--border)] bg-[var(--background)] px-4 py-1.5 text-sm font-medium text-[var(--foreground)] transition-colors hover:border-emerald-600/50 hover:text-emerald-800 dark:hover:text-emerald-300"
      }
    >
      {label}
    </Link>
  );
}
