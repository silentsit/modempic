import { describe, expect, it } from "vitest";
import { authorizationServerMetadata, protectedResourceMetadata, renderAuthMd } from "./auth-md";

describe("auth.md discovery", () => {
  const origin = "https://modempic.com";
  const md = renderAuthMd(origin);
  const prm = protectedResourceMetadata(origin);
  const as = authorizationServerMetadata(origin);

  it("serves a markdown H1 that contains auth.md", () => {
    expect(md.startsWith("# auth.md\n")).toBe(true);
    expect(md).toContain("/register");
    expect(md).toContain("verified_email");
  });

  it("publishes RFC 9728 protected resource metadata", () => {
    expect(prm.resource).toBe("https://modempic.com/");
    expect(prm.authorization_servers).toEqual([origin]);
    expect(prm.scopes_supported.length).toBeGreaterThan(0);
    expect(prm.bearer_methods_supported).toEqual(["header"]);
    expect(prm.agent_auth.skill).toBe(`${origin}/auth.md`);
    expect(prm.agent_auth.register_uri).toBe(`${origin}/register`);
  });

  it("keeps authorization server issuer aligned with PRM and a complete agent_auth method", () => {
    expect(as.issuer).toBe(origin);
    expect(as.issuer).toBe(prm.authorization_servers[0]);
    expect(as.agent_auth.skill).toBe(`${origin}/auth.md`);
    expect(as.agent_auth.register_uri).toBe(`${origin}/register`);
    expect(as.agent_auth.claim_uri).toBe(`${origin}/register`);
    expect(as.agent_auth.identity_types_supported).toEqual(["identity_assertion"]);
    expect(as.agent_auth.identity_assertion.assertion_types_supported).toEqual(["verified_email"]);
    expect(as.agent_auth.identity_assertion.credential_types_supported).toEqual(["session_cookie"]);
    expect(as.authorization_endpoint).toBe(`${origin}/login`);
    expect(as).not.toHaveProperty("token_endpoint");
    expect(as).not.toHaveProperty("jwks_uri");
    expect(md).not.toContain("openid-configuration");
  });
});
