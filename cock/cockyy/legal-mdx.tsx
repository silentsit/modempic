import type { MDXComponents } from "mdx/types";
import Link from "next/link";

export const legalMdxComponents: MDXComponents = {
  h1: (props: React.ComponentPropsWithoutRef<"h1">) => (
    <h1 className="text-3xl font-bold tracking-tight text-[var(--foreground)] sm:text-4xl" {...props} />
  ),
  h2: (props: React.ComponentPropsWithoutRef<"h2">) => (
    <h2 className="mt-10 scroll-mt-24 text-xl font-semibold text-[var(--foreground)] first:mt-0" {...props} />
  ),
  h3: (props: React.ComponentPropsWithoutRef<"h3">) => (
    <h3 className="mt-6 text-lg font-semibold text-[var(--foreground)]" {...props} />
  ),
  p: (props: React.ComponentPropsWithoutRef<"p">) => (
    <p className="mt-3 leading-relaxed text-[var(--muted-foreground)]" {...props} />
  ),
  strong: (props: React.ComponentPropsWithoutRef<"strong">) => (
    <strong className="font-semibold text-[var(--foreground)]" {...props} />
  ),
  ul: (props: React.ComponentPropsWithoutRef<"ul">) => (
    <ul className="mt-3 list-disc space-y-2 pl-5 text-[var(--muted-foreground)]" {...props} />
  ),
  ol: (props: React.ComponentPropsWithoutRef<"ol">) => (
    <ol className="mt-3 list-decimal space-y-2 pl-5 text-[var(--muted-foreground)]" {...props} />
  ),
  li: (props: React.ComponentPropsWithoutRef<"li">) => <li className="leading-relaxed" {...props} />,
  a: ({ href, children, ...rest }: React.ComponentPropsWithoutRef<"a">) => {
    if (href?.startsWith("/")) {
      return (
        <Link href={href} className="text-emerald-700 underline underline-offset-2 hover:no-underline dark:text-emerald-400" {...rest}>
          {children}
        </Link>
      );
    }
    return (
      <a
        href={href}
        className="text-emerald-700 underline underline-offset-2 hover:no-underline dark:text-emerald-400"
        target="_blank"
        rel="noopener noreferrer"
        {...rest}
      >
        {children}
      </a>
    );
  },
};
