import { describe, expect, it } from "vitest";
import {
  compareNav,
  footerSections,
  headerNav,
  mobileNavChildren,
  shippingCountryNavLabel,
  shippingDestinationNav,
  shippingMenuNav,
  shopMenuExtraNav,
  shortCompareNavLabel,
} from "./site-navigation";

describe("site navigation", () => {
  it("puts the price hub in the Shop menu and Compare footer list", () => {
    expect(shopMenuExtraNav.some((item) => item.href === "/modafinil-price-comparison")).toBe(true);
    expect(compareNav[0]?.href).toBe("/modafinil-price-comparison");
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

  it("puts worldwide first in the footer Shipping column", () => {
    const shipping = footerSections.find((section) => section.title === "Shipping");
    expect(shipping?.links[0]).toMatchObject({ href: "/shipping", label: "We ship worldwide" });
    expect(shipping?.links.map((item) => item.href)).toEqual(
      expect.arrayContaining(["/shipping", "/shipping/sweden", "/shipping/germany"]),
    );
    expect(shipping?.links).toHaveLength(11);
  });
});
