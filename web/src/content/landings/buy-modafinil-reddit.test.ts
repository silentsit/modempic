import { describe, expect, it } from "vitest";
import { buyModafinilRedditCopy } from "./buy-modafinil-reddit";
import { pageDocumentTitle, pageShareTitle } from "@/lib/seo/page-metadata";

describe("buyModafinilRedditCopy", () => {
  it("keeps Buy Modafinil Reddit in the title, H1, and first sentence", () => {
    const phrase = "Buy Modafinil Reddit";
    expect(buyModafinilRedditCopy.seo.title).toContain(phrase);
    expect(buyModafinilRedditCopy.hero.headline).toContain(phrase);
    expect(buyModafinilRedditCopy.hero.paragraphs[0].startsWith(phrase)).toBe(true);
  });

  it("keeps the document title under 70 characters including the brand suffix", () => {
    expect(pageShareTitle(buyModafinilRedditCopy.seo.title).length).toBeLessThanOrEqual(70);
    expect(pageDocumentTitle(buyModafinilRedditCopy.seo.title).length).toBeLessThanOrEqual(58);
  });

  it("opens on sourcing threads versus a checkable checkout", () => {
    const first = buyModafinilRedditCopy.hero.paragraphs[0];
    expect(first).toMatch(/sourcing threads/i);
    expect(first).toMatch(/checkout you can inspect/i);
  });

  it("maps a public verification checklist to storefront URLs", () => {
    const hrefs = buyModafinilRedditCopy.checklist.items.map((item) => item.href);
    expect(hrefs).toEqual([
      "/modafinil-price-comparison",
      "/how-to-pay",
      "/shipping",
      "/refund-policy",
      "/modempic-reviews",
    ]);
  });

  it("answers the three SERP sourcing questions as featured copy", () => {
    const questions = buyModafinilRedditCopy.featuredQuestions.map((item) => item.q);
    expect(questions).toHaveLength(3);
    expect(questions[0]).toMatch(/lost my vendor/i);
    expect(questions[1]).toMatch(/prescription or telehealth/i);
    expect(questions[2]).toMatch(/customs/i);
  });

  it("links out to where-to-buy instead of recapping the label FAQ", () => {
    const blob = JSON.stringify(buyModafinilRedditCopy);
    expect(blob).toContain("/where-to-buy-modafinil-online#faq");
    expect(blob).not.toMatch(/what is Modafinil used for/i);
    expect(blob).not.toMatch(/Provigil label/i);
  });

  it("does not invent Reddit thread findings or vendor league tables", () => {
    const blob = JSON.stringify(buyModafinilRedditCopy);
    expect(blob).toMatch(/do not rank them, quote anonymous posts, or call any shop Reddit-approved/i);
    expect(blob).not.toMatch(/\d+%\s+of\s+threads/i);
    expect(blob).not.toMatch(/500\s+Reddit/i);
    expect(blob).not.toMatch(/Reddit-approved vendor/i);
  });
});
