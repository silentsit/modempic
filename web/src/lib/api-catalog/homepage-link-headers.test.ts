import { describe, expect, it } from "vitest";
import {
  HOMEPAGE_AGENT_DISCOVERY_RELS,
  applyHomepageLinkHeaders,
  homepageAgentDiscoveryLinkHeader,
} from "./homepage-link-headers";

describe("homepage agent discovery Link headers", () => {
  it("advertises the four registered relation types", () => {
    const header = homepageAgentDiscoveryLinkHeader();
    expect(header).toContain("</.well-known/api-catalog>");
    for (const rel of HOMEPAGE_AGENT_DISCOVERY_RELS) {
      expect(header).toContain(`rel="${rel}"`);
    }
  });

  it("appends Link on the homepage only and does not duplicate", () => {
    const home = new Headers();
    applyHomepageLinkHeaders(home, "/");
    applyHomepageLinkHeaders(home, "/");
    expect(home.get("Link")?.match(/rel="api-catalog"/g)?.length).toBe(1);

    const shop = new Headers();
    applyHomepageLinkHeaders(shop, "/shop");
    expect(shop.get("Link")).toBeNull();
  });
});
