import fs from "node:fs";
import path from "node:path";
import { MDXRemote } from "next-mdx-remote/rsc";
import { Container } from "@/components/site/container";
import { legalMdxComponents } from "./legal-mdx";

export function LegalMarkdownPage({ file }: { file: string }) {
  const source = fs.readFileSync(path.join(process.cwd(), "src/content/legal", file), "utf8");
  return (
    <Container className="py-10 sm:py-14">
      <article className="prose-custom max-w-3xl text-sm">
        <MDXRemote source={source} components={legalMdxComponents} />
      </article>
    </Container>
  );
}
