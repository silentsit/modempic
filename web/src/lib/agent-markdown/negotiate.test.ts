import { describe, expect, it } from "vitest";
import { isMarkdownNegotiablePath, prefersMarkdown, safeMarkdownSourcePath } from "./negotiate";
import { estimateMarkdownTokens, htmlToMarkdown } from "./html-to-markdown";

describe("prefersMarkdown", () => {
  it("returns markdown for Accept: text/markdown", () => {
    expect(prefersMarkdown("text/markdown")).toBe(true);
    expect(prefersMarkdown("text/markdown, text/html")).toBe(true);
  });

  it("keeps HTML as the browser default", () => {
    expect(prefersMarkdown(null)).toBe(false);
    expect(prefersMarkdown("text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8")).toBe(false);
    expect(prefersMarkdown("text/html, text/markdown;q=0.1")).toBe(false);
  });
});

describe("isMarkdownNegotiablePath", () => {
  it("allows storefront documents and skips assets and private surfaces", () => {
    expect(isMarkdownNegotiablePath("/")).toBe(true);
    expect(isMarkdownNegotiablePath("/shop")).toBe(true);
    expect(isMarkdownNegotiablePath("/api/health")).toBe(false);
    expect(isMarkdownNegotiablePath("/robots.txt")).toBe(false);
    expect(isMarkdownNegotiablePath("/modempic-logo.svg")).toBe(false);
    expect(isMarkdownNegotiablePath("/openapi/health.json")).toBe(false);
    expect(isMarkdownNegotiablePath("/llms.txt")).toBe(false);
    expect(isMarkdownNegotiablePath("/docs/api")).toBe(false);
    expect(isMarkdownNegotiablePath("/documentation")).toBe(true);
    expect(isMarkdownNegotiablePath("/.well-known/api-catalog")).toBe(false);
    expect(isMarkdownNegotiablePath("/oauth/token")).toBe(false);
    expect(isMarkdownNegotiablePath("/cart")).toBe(false);
    expect(isMarkdownNegotiablePath("/checkout")).toBe(false);
  });
});

describe("safeMarkdownSourcePath", () => {
  it("rejects open-redirect style paths and normalizes traversal", () => {
    expect(safeMarkdownSourcePath("/shop")).toBe("/shop");
    expect(safeMarkdownSourcePath("/shop?query=modafinil")).toBe("/shop?query=modafinil");
    expect(safeMarkdownSourcePath("//evil.example")).toBeNull();
    expect(safeMarkdownSourcePath("https://evil.example/")).toBeNull();
    expect(safeMarkdownSourcePath("/../admin")).toBeNull();
    expect(safeMarkdownSourcePath("/../account")).toBeNull();
  });
});

describe("htmlToMarkdown", () => {
  it("strips layout chrome and returns markdown", () => {
    const md = htmlToMarkdown(
      `<html><head><title>Modempic</title></head><body><nav>Nav</nav><main><h1>Hello</h1><p>Shop <a href="/shop">catalog</a>.</p></main></body></html>`,
    );
    expect(md).toContain("# Modempic");
    expect(md).toContain("[catalog](/shop)");
    expect(md).not.toContain("<html");
    expect(estimateMarkdownTokens(md)).toBeGreaterThan(0);
  });
});
