import Link from "next/link";
import { Fragment } from "react";
import { ProductCard } from "@/components/shop/product-card";
import type {
  PortableTextBlock,
  PortableTextSpan,
  ProductEmbedBlock,
} from "@/types";

/**
 * ============================================================================
 * PORTABLE TEXT RENDERER — scaffold for Sanity article bodies.
 *
 * RSC-safe (no hooks, no client directives). Covers the PortableTextBlock
 * contract from types.ts:
 *   - block styles: normal, h2, h3, h4, blockquote
 *   - marks: strong, em, underline, code + "link" markDefs
 *   - lists: bullet / number (consecutive listItems grouped into <ul>/<ol>)
 *   - images: _type "image" (asset.url resolved by the GROQ query)
 *   - CUSTOM: _type "productEmbed" -> renders <ProductCard /> inline
 *
 * TODO(cursor): GROQ projection should resolve references at fetch time:
 *   body[]{
 *     ...,
 *     _type == "productEmbed" => { ..., "product": product->->medusaId },
 *     asset->{ url }
 *   }
 * then hydrate `product` into the full Product via the Medusa Store API.
 * ============================================================================
 */

/* ---------------------------------- marks --------------------------------- */

function renderSpan(span: PortableTextSpan, markDefs: PortableTextBlock["markDefs"]) {
  let node: React.ReactNode = span.text;

  for (const mark of span.marks ?? []) {
    switch (mark) {
      case "strong":
        node = <strong className="font-semibold text-foreground">{node}</strong>;
        break;
      case "em":
        node = <em>{node}</em>;
        break;
      case "underline":
        node = <span className="underline underline-offset-2">{node}</span>;
        break;
      case "code":
        node = (
          <code className="rounded-md border border-border bg-muted px-1.5 py-0.5 font-mono text-[0.875em]">
            {node}
          </code>
        );
        break;
      default: {
        // Annotation mark — look up in markDefs (e.g. links)
        const def = markDefs?.find((d) => d._key === mark);
        if (def?._type === "link" && def.href) {
          const href = def.href;
          node = href.startsWith("/") ? (
            <Link href={href} className="font-medium text-accent underline underline-offset-2 transition-colors hover:text-accent-hover">
              {node}
            </Link>
          ) : (
            <a
              href={href}
              className="font-medium text-accent underline underline-offset-2 transition-colors hover:text-accent-hover"
              target="_blank"
              rel="noopener noreferrer"
            >
              {node}
            </a>
          );
        }
      }
    }
  }
  return <Fragment key={span._key}>{node}</Fragment>;
}

/* --------------------------------- blocks --------------------------------- */

function BlockRenderer({ block }: { block: PortableTextBlock }) {
  const children = block.children?.map((span) => renderSpan(span, block.markDefs));

  switch (block.style) {
    case "h2":
      return (
        <h2 className="mt-10 scroll-mt-24 text-2xl font-semibold tracking-tight text-foreground first:mt-0">
          {children}
        </h2>
      );
    case "h3":
      return <h3 className="mt-8 text-xl font-semibold tracking-tight text-foreground">{children}</h3>;
    case "h4":
      return <h4 className="mt-6 text-lg font-semibold tracking-tight text-foreground">{children}</h4>;
    case "blockquote":
      return (
        <blockquote className="my-8 border-l-2 border-accent pl-5 text-base italic leading-relaxed text-muted-foreground">
          {children}
        </blockquote>
      );
    default:
      return <p className="mt-5 leading-[1.8] text-muted-foreground first:mt-0">{children}</p>;
  }
}

function ImageBlock({ block }: { block: PortableTextBlock }) {
  const url = block.asset?.url;
  if (!url) return null;
  return (
    <figure className="my-10">
      {/* eslint-disable-next-line @next/next/no-img-element -- Sanity CDN URLs */}
      <img
        src={url}
        alt={block.alt ?? ""}
        className="h-auto w-full rounded-2xl border border-border"
        loading="lazy"
        decoding="async"
      />
      {block.alt ? (
        <figcaption className="mt-3 text-center text-sm text-muted-foreground">{block.alt}</figcaption>
      ) : null}
    </figure>
  );
}

/** Custom interceptor: product embed renders a live ProductCard mid-article. */
function ProductEmbed({ block }: { block: ProductEmbedBlock }) {
  return (
    <div className={block.layout === "wide" ? "my-10" : "mx-auto my-10 max-w-sm"}>
      <ProductCard
        product={block.product}
        buyNowHref={`/checkout?buy=${encodeURIComponent(block.product.handle)}`}
      />
    </div>
  );
}

/* ------------------------------ list grouping ----------------------------- */

type RenderNode =
  | { kind: "block"; block: PortableTextBlock }
  | { kind: "list"; listType: "bullet" | "number"; items: PortableTextBlock[] };

function groupBlocks(blocks: (PortableTextBlock | ProductEmbedBlock)[]): RenderNode[] {
  const nodes: RenderNode[] = [];
  for (const block of blocks) {
    if (block._type === "block" && block.listItem) {
      const last = nodes[nodes.length - 1];
      if (last?.kind === "list" && last.listType === block.listItem) {
        last.items.push(block);
      } else {
        nodes.push({ kind: "list", listType: block.listItem, items: [block] });
      }
    } else {
      nodes.push({ kind: "block", block });
    }
  }
  return nodes;
}

/* --------------------------------- public --------------------------------- */

export function RichTextRenderer({ body }: { body: (PortableTextBlock | ProductEmbedBlock)[] }) {
  if (!body?.length) return null;

  return (
    <div className="rich-text">
      {groupBlocks(body).map((node, i) => {
        if (node.kind === "list") {
          const Tag = node.listType === "number" ? "ol" : "ul";
          return (
            <Tag
              key={i}
              className={
                node.listType === "number"
                  ? "mt-5 list-decimal space-y-2 pl-5 text-muted-foreground marker:text-primary"
                  : "mt-5 list-disc space-y-2 pl-5 text-muted-foreground marker:text-primary"
              }
            >
              {node.items.map((item) => (
                <li key={item._key} className="leading-relaxed">
                  {item.children?.map((span) => renderSpan(span, item.markDefs))}
                </li>
              ))}
            </Tag>
          );
        }

        const block = node.block;
        if (block._type === "productEmbed") {
          return <ProductEmbed key={block._key} block={block as unknown as ProductEmbedBlock} />;
        }
        if (block._type === "image") {
          return <ImageBlock key={block._key} block={block} />;
        }
        return <BlockRenderer key={block._key} block={block} />;
      })}
    </div>
  );
}
