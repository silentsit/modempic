import { describe, expect, it } from "vitest";
import { contentSecurityPolicy } from "./content-security-policy";

describe("contentSecurityPolicy", () => {
  it("names the live third-party hosts the storefront already loads", () => {
    const policy = contentSecurityPolicy({ isDev: false });
    expect(policy).toContain("default-src 'self'");
    expect(policy).toContain("object-src 'none'");
    expect(policy).toContain("https://www.googletagmanager.com");
    expect(policy).toContain("https://news.google.com");
    expect(policy).toContain("https://res.cloudinary.com");
    expect(policy).toContain("https://static.cloudflareinsights.com");
    expect(policy).toContain("upgrade-insecure-requests");
    expect(policy).not.toContain("'unsafe-eval'");
  });

  it("keeps Fast Refresh working in development", () => {
    const policy = contentSecurityPolicy({ isDev: true });
    expect(policy).toContain("'unsafe-eval'");
    expect(policy).toContain("ws://localhost:*");
    expect(policy).not.toContain("upgrade-insecure-requests");
  });
});