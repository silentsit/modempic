import { describe, expect, it } from "vitest";
import { renderLlmsTxt } from "./llms-txt";

describe("renderLlmsTxt", () => {
  it("describes the storefront and points at the API catalog", () => {
    const body = renderLlmsTxt("https://modempic.com");
    expect(body.startsWith("# Modempic\n")).toBe(true);
    expect(body).toContain("https://modempic.com/.well-known/api-catalog");
    expect(body).toContain("https://modempic.com/.well-known/oauth-authorization-server");
    expect(body).toContain("https://modempic.com/.well-known/openid-configuration");
    expect(body).toContain("https://modempic.com/shop");
    expect(body).toMatch(/not medical advice/i);
  });
});
