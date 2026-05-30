import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { resolveClientPostLoginRedirect } from "./post-login-redirect-client";

describe("resolveClientPostLoginRedirect", () => {
  beforeEach(() => {
    vi.stubGlobal("window", {
      location: { origin: "https://modempic.com", hostname: "modempic.com" },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns fallback when auth url is missing", () => {
    expect(resolveClientPostLoginRedirect(null, "/account")).toBe("/account");
  });

  it("rewrites localhost callback to a path on production", () => {
    expect(resolveClientPostLoginRedirect("http://localhost:3000/account", "/account")).toBe("/account");
  });

  it("keeps same-origin absolute urls as paths", () => {
    expect(resolveClientPostLoginRedirect("https://modempic.com/checkout", "/account")).toBe("/checkout");
  });
});
