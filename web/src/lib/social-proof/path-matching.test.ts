import { describe, expect, it } from "vitest";
import { pathnameMatchesDefaultSocialProofRoutes, pathnameShowsSocialProof, pathnameShowsSocialProofWithRules } from "./path-matching";

describe("pathnameMatchesDefaultSocialProofRoutes", () => {
  it("allows home, shop, product", () => {
    expect(pathnameMatchesDefaultSocialProofRoutes("/")).toBe(true);
    expect(pathnameMatchesDefaultSocialProofRoutes("/shop")).toBe(true);
    expect(pathnameMatchesDefaultSocialProofRoutes("/shop/nootropics")).toBe(true);
    expect(pathnameMatchesDefaultSocialProofRoutes("/product/foo")).toBe(true);
  });

  it("blocks checkout, cart, account, admin, auth, order", () => {
    expect(pathnameMatchesDefaultSocialProofRoutes("/checkout")).toBe(false);
    expect(pathnameMatchesDefaultSocialProofRoutes("/cart")).toBe(false);
    expect(pathnameMatchesDefaultSocialProofRoutes("/account")).toBe(false);
    expect(pathnameMatchesDefaultSocialProofRoutes("/admin")).toBe(false);
    expect(pathnameMatchesDefaultSocialProofRoutes("/login")).toBe(false);
    expect(pathnameMatchesDefaultSocialProofRoutes("/order/123/confirmation")).toBe(false);
  });
});

describe("pathnameShowsSocialProof", () => {
  it("honors allowlist override", () => {
    expect(pathnameShowsSocialProof("/about", "/about,/faq")).toBe(true);
    expect(pathnameShowsSocialProof("/faq/help", "/faq")).toBe(true);
    expect(pathnameShowsSocialProof("/checkout", "/shop")).toBe(false);
  });

  it("supports asterisk override", () => {
    expect(pathnameShowsSocialProof("/checkout", "*")).toBe(true);
  });
});

describe("pathnameShowsSocialProofWithRules", () => {
  it("respects allow and exclude lists", () => {
    expect(pathnameShowsSocialProofWithRules("/shop", ["/shop"], ["/shop/secret"])).toBe(true);
    expect(pathnameShowsSocialProofWithRules("/shop/secret", ["/shop"], ["/shop/secret"])).toBe(false);
    expect(pathnameShowsSocialProofWithRules("/anywhere", ["*"], [])).toBe(true);
    expect(
      pathnameShowsSocialProofWithRules("/checkout", ["*"], [
        "/checkout",
        "/cart",
        "/account",
        "/admin",
        "/login",
        "/register",
        "/order",
      ]),
    ).toBe(false);
    expect(
      pathnameShowsSocialProofWithRules("/login", ["*"], [
        "/checkout",
        "/cart",
        "/account",
        "/admin",
        "/login",
        "/register",
        "/order",
      ]),
    ).toBe(false);
    expect(
      pathnameShowsSocialProofWithRules("/blog/post", ["*"], [
        "/checkout",
        "/cart",
        "/account",
        "/admin",
        "/login",
        "/register",
        "/order",
      ]),
    ).toBe(true);
  });
});
