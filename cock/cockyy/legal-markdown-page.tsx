import fs from "node:fs";
import path from "node:path";
import { MDXRemote } from "next-mdx-remote/rsc";
import { Breadcrumbs, type Crumb } from "@/components/seo/breadcrumbs";
import { RelatedLinks, type RelatedLink } from "@/components/seo/related-links";
import { Container } from "@/components/site/container";
import { legalMdxComponents } from "./legal-mdx";

type Props = {
  file: string;
  /** Breadcrumb trail; final crumb should be the page label without href. */
  crumbs?: Crumb[];
  /** Optional cross-link block rendered after the article body. */
  related?: RelatedLink[];
};

export function LegalMarkdownPage({ file, crumbs, related }: Props) {
  const source = fs.readFileSync(path.join(process.cwd(), "src/content/legal", file), "utf8");
  return (
    <Container className="py-10 sm:py-14">
      {crumbs && crumbs.length > 0 ? <Breadcrumbs crumbs={crumbs} /> : null}
      <article className="prose-custom mt-3 max-w-3xl text-sm">
        <MDXRemote source={source} components={legalMdxComponents} />
      </article>
      {related && related.length > 0 ? <RelatedLinks links={related} /> : null}
    </Container>
  );
}
