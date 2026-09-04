import { describe, expect, it } from "vitest";
import { buildOrganizationJsonLd, buildSiteGraphJsonLd } from "./organization-json-ld";

describe("organization JSON-LD", () => {
  it("uses OnlineStore with return and shipping policies", () => {
    const organization = buildOrganizationJsonLd("https://modempic.com/");
    expect(organization["@type"]).toBe("OnlineStore");
    expect(organization["@id"]).toBe("https://modempic.com/#organization");
    expect(organization.logo.url).toBe("https://modempic.com/modempic-logo.png");
    expect(organization.hasMerchantReturnPolicy["@type"]).toBe("MerchantReturnPolicy");
    expect(organization.hasShippingService["@type"]).toBe("ShippingService");
    expect(organization.hasShippingService.shippingConditions).toHaveLength(2);
    expect(organization.contactPoint[0]).not.toHaveProperty("name");
  });

  it("pairs OnlineStore with a WebSite SearchAction", () => {
    const graph = buildSiteGraphJsonLd("https://modempic.com");
    const website = graph["@graph"][1];
    expect(graph["@graph"]).toHaveLength(2);
    expect(website?.["@type"]).toBe("WebSite");
    if (website?.["@type"] !== "WebSite") throw new Error("expected WebSite node");
    expect(website.potentialAction.target.urlTemplate).toBe(
      "https://modempic.com/shop?query={search_term_string}",
    );
  });
});
