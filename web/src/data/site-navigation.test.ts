import { describe, expect, it } from "vitest";
import {
  compareNav,
  footerSections,
  COMPARE_SITEMAP_PATHS,
  headerNav,
  mobileNavChildren,
  shippingCountryNavLabel,
  shippingDestinationNav,
  shippingMenuNav,
  shopMenuExtraNav,
  shortCompareNavLabel,
} from "./site-navigation";

describe("site navigation", () => {
  it("puts the Modafinil money page in the header after Shop", () => {
    expect(headerNav.map((item) => item.href)).toEqual([
      "/shop",
      "/where-to-buy-modafinil-online",
      "/how-to-pay",
      "/about",
      "/shipping",
      "/contact",
    ]);
    expect(headerNav[1]).toMatchObject({ href: "/where-to-buy-modafinil-online", label: "Where to Buy" });
  });

  it("puts the price hub in the Shop menu and Company footer list", () => {
    expect(shopMenuExtraNav.some((item) => item.href === "/modafinil-price-comparison")).toBe(true);
    expect(compareNav[0]?.href).toBe("/modafinil-price-comparison");
    const company = footerSections.find((section) => section.title === "Company");
    expect(company?.links.some((item) => item.href === "/modafinil-price-comparison")).toBe(true);
    expect(company?.links.some((item) => item.href === "/modempic-reviews")).toBe(true);
  });

  it("lists every country shipping page", () => {
    expect(shippingDestinationNav.map((item) => item.href)).toEqual(
      expect.arrayContaining([
        "/shipping/united-states",
        "/shipping/united-kingdom",
        "/shipping/australia",
        "/shipping/sweden",
      ]),
    );
    expect(shippingDestinationNav).toHaveLength(10);
    expect(shippingCountryNavLabel("the United States")).toBe("United States");
  });

  it("uses short comparison labels and canonical pair URLs", () => {
    expect(shortCompareNavLabel("buy-waklert-150-mg", "buy-modalert-200-mg")).toBe("Waklert vs Modalert");
    expect(compareNav.some((item) => item.href === "/compare/modalert-200-mg-vs-waklert-150-mg")).toBe(true);
    expect(COMPARE_SITEMAP_PATHS).toEqual([
      "/compare/modalert-200-mg-vs-waklert-150-mg",
      "/compare/artvigil-150-mg-vs-modalert-200-mg",
      "/compare/modalert-200-mg-vs-vilafinil-200-mg",
      "/compare/artvigil-150-mg-vs-waklert-150-mg",
    ]);
  });

  it("exposes Shipping as a worldwide-first header dropdown", () => {
    const shipping = headerNav.find((item) => item.href === "/shipping");
    expect(shipping?.children?.[0]).toMatchObject({ href: "/shipping", label: "We ship worldwide" });
    expect(shipping?.children?.some((item) => item.groupLabel === "Destination notes")).toBe(true);
    expect(shippingMenuNav).toHaveLength(11);
  });

  it("puts the parent landing page first in mobile accordion lists", () => {
    const shop = headerNav.find((item) => item.href === "/shop");
    const shipping = headerNav.find((item) => item.href === "/shipping");
    expect(mobileNavChildren(shop!).map((item) => item.href)[0]).toBe("/shop");
    expect(mobileNavChildren(shipping!).map((item) => item.href)[0]).toBe("/shipping");
    expect(mobileNavChildren(shipping!)[0]?.label).toBe("We ship worldwide");
    expect(mobileNavChildren(shop!).some((item) => item.href === "/modafinil-price-comparison")).toBe(true);
  });

  it("keeps the footer to three short columns without country dumps", () => {
    expect(footerSections.map((section) => section.title)).toEqual(["Shop", "Company", "Help"]);
    const hrefs = footerSections.flatMap((section) => section.links.map((item) => item.href));
    expect(hrefs).toContain("/shipping");
    expect(hrefs.some((href) => href.startsWith("/shipping/"))).toBe(false);
    expect(hrefs.some((href) => href.startsWith("/compare/"))).toBe(false);
    expect(hrefs).not.toContain("/sitemap");
    expect(hrefs).not.toContain("/where-to-buy-modafinil-online");
    expect(footerSections.find((section) => section.title === "Help")?.links).toHaveLength(4);
  });
});
