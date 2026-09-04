import { describe, expect, it } from "vitest";
import {
  isCanonicalPublicHostname,
  requestHostname,
  shouldNoindexNonCanonicalHost,
  shouldRedirectVercelAppToCanonical,
} from "./canonical-host";

describe("canonical host policy", () => {
  it("parses forwarded host headers", () => {
    expect(requestHostname("modempic.com:443")).toBe("modempic.com");
    expect(requestHostname("modempic-git-main-user.vercel.app, modempic.com")).toBe(
      "modempic-git-main-user.vercel.app",
    );
  });

  it("treats apex and www as canonical", () => {
    expect(isCanonicalPublicHostname("modempic.com")).toBe(true);
    expect(isCanonicalPublicHostname("www.modempic.com")).toBe(true);
    expect(isCanonicalPublicHostname("modempic.vercel.app")).toBe(false);
  });

  it("redirects production Vercel aliases only", () => {
    expect(shouldRedirectVercelAppToCanonical("modempic.vercel.app", "production")).toBe(true);
    expect(shouldRedirectVercelAppToCanonical("modempic-git-foo.vercel.app", "preview")).toBe(false);
    expect(shouldRedirectVercelAppToCanonical("modempic.com", "production")).toBe(false);
  });

  it("noindexes preview and other non-canonical hosts", () => {
    expect(shouldNoindexNonCanonicalHost("modempic-git-foo.vercel.app")).toBe(true);
    expect(shouldNoindexNonCanonicalHost("localhost")).toBe(false);
    expect(shouldNoindexNonCanonicalHost("modempic.com")).toBe(false);
  });
});
