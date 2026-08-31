import { describe, expect, it } from "vitest";
import { API_CATALOG_CONTENT_TYPE, apiCatalogDocument } from "./catalog";

describe("apiCatalogDocument", () => {
  const doc = apiCatalogDocument("https://modempic.com");

  it("lists public APIs with RFC 8631 service-desc, service-doc, and status links", () => {
    expect(doc.linkset.length).toBeGreaterThanOrEqual(1);
    for (const entry of doc.linkset) {
      expect(entry.anchor).toMatch(/^https:\/\/modempic\.com\/api\//);
      expect(entry["service-desc"][0]?.href).toMatch(/\/openapi\/.+\.json$/);
      expect(entry["service-desc"][0]?.type).toBe("application/json");
      expect(entry["service-doc"][0]?.href).toMatch(/^https:\/\/modempic\.com\//);
    }
    const health = doc.linkset.find((entry) => entry.anchor.endsWith("/api/health"));
    expect(health?.status?.[0]?.href).toBe("https://modempic.com/api/health");
  });

  it("uses the RFC 9727 linkset media type", () => {
    expect(API_CATALOG_CONTENT_TYPE).toContain("application/linkset+json");
    expect(API_CATALOG_CONTENT_TYPE).toContain("rfc9727");
  });
});
