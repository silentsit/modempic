import { describe, expect, it } from "vitest";
import {
  authorizationServerMetadata,
  jwksDocument,
  protectedResourceMetadata,
  renderAuthMd,
} from "./auth-md";

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
  });

  it("publishes RFC 8414 / OIDC discovery fields", () => {
    expect(as.authorization_endpoint).toBe(`${origin}/login`);
    expect(as.token_endpoint).toBe(`${origin}/oauth/token`);
    expect(as.jwks_uri).toBe(`${origin}/.well-known/jwks.json`);
    expect(as.grant_types_supported).toEqual(["authorization_code"]);
    expect(as.response_types_supported).toEqual(["code"]);
    expect(as.service_documentation).toBe(`${origin}/auth.md`);
    expect(jwksDocument().keys).toEqual([]);
    expect(md).toContain("/.well-known/openid-configuration");
    expect(md).toContain("token_endpoint");
  });
});
