import type { MDXComponents } from "mdx/types";
import Link from "next/link";

export const legalMdxComponents: MDXComponents = {
  h1: (props: React.ComponentPropsWithoutRef<"h1">) => (
    <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl" {...props} />
  ),
  h2: (props: React.ComponentPropsWithoutRef<"h2">) => (
    <h2 className="mt-10 scroll-mt-24 text-xl font-semibold tracking-tight text-foreground first:mt-0" {...props} />
  ),
  h3: (props: React.ComponentPropsWithoutRef<"h3">) => (
    <h3 className="mt-6 text-lg font-semibold tracking-tight text-foreground" {...props} />
  ),
  p: (props: React.ComponentPropsWithoutRef<"p">) => (
    <p className="mt-4 leading-[1.8] text-muted-foreground" {...props} />
  ),
  strong: (props: React.ComponentPropsWithoutRef<"strong">) => (
    <strong className="font-semibold text-foreground" {...props} />
  ),
  ul: (props: React.ComponentPropsWithoutRef<"ul">) => (
    <ul className="mt-4 list-disc space-y-2 pl-5 text-muted-foreground marker:text-primary" {...props} />
  ),
  ol: (props: React.ComponentPropsWithoutRef<"ol">) => (
    <ol className="mt-4 list-decimal space-y-2 pl-5 text-muted-foreground marker:text-primary" {...props} />
  ),
  li: (props: React.ComponentPropsWithoutRef<"li">) => <li className="leading-relaxed" {...props} />,
  a: ({ href, children, ...rest }: React.ComponentPropsWithoutRef<"a">) => {
    if (href?.startsWith("/")) {
      return (
        <Link
          href={href}
          className="font-medium text-accent underline underline-offset-2 transition-colors hover:text-accent-hover"
          {...rest}
        >
          {children}
        </Link>
      );
    }
    return (
      <a
        href={href}
        className="font-medium text-accent underline underline-offset-2 transition-colors hover:text-accent-hover"
        target="_blank"
        rel="noopener noreferrer"
        {...rest}
      >
        {children}
      </a>
    );
  },
};
