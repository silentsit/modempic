import Link from "next/link";

/** Inline “shop by category” links for PLP intro copy. */
export function ShopCategoryIntroLinks({
  categories,
}: {
  categories: { name: string; slug: string }[];
}) {
  if (categories.length === 0) return null;

  return (
    <>
      {categories.map((category, index) => (
        <span key={category.slug}>
          {index > 0 ? ", " : null}
          <Link href={`/shop/${category.slug}`} className="underline-offset-2 hover:underline">
            {category.name}
          </Link>
        </span>
      ))}
    </>
  );
}
