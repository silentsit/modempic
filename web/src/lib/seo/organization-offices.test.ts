import { describe, expect, it } from "vitest";
import {
  ORGANIZATION_OFFICES,
  organizationLocations,
  organizationPostalAddresses,
} from "./organization-offices";

describe("organization offices schema", () => {
  it("publishes four PostalAddress objects with ISO country codes", () => {
    const addresses = organizationPostalAddresses();
    expect(addresses).toHaveLength(4);
    expect(addresses.map((a) => a.addressCountry)).toEqual(["US", "TH", "SG", "GB"]);
    expect(addresses[0]).toMatchObject({
      "@type": "PostalAddress",
      streetAddress: "580 California Street, 12th and 16th Floor",
      addressLocality: "San Francisco",
      addressRegion: "CA",
      postalCode: "94104",
    });
    expect(addresses[1].streetAddress).toContain("Sathorn Square Tower");
    expect(addresses[2]).toMatchObject({
      addressLocality: "Singapore",
      postalCode: "048616",
    });
    expect(addresses[3]).toMatchObject({
      addressLocality: "London",
      postalCode: "EC2N 4AJ",
    });
  });

  it("pairs each office with a named Place for Organization.location", () => {
    const places = organizationLocations();
    expect(places.map((p) => p.name)).toEqual([
      "580 California Street",
      "Sathorn Square Tower",
      "One Raffles Place",
      "22 Bishopsgate",
    ]);
    expect(places[0]?.address["@type"]).toBe("PostalAddress");
  });

  it("keeps office data schema-only with no display lines", () => {
    expect(ORGANIZATION_OFFICES).toHaveLength(4);
    expect(ORGANIZATION_OFFICES.every((office) => !("displayLines" in office))).toBe(true);
  });
});
