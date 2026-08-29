export type OrganizationOffice = {
  name: string;
  streetAddress: string;
  addressLocality: string;
  addressRegion?: string;
  postalCode: string;
  addressCountry: "US" | "TH" | "SG" | "GB";
};

/** Registered offices used only in Organization JSON-LD, not rendered on the storefront. */
export const ORGANIZATION_OFFICES: readonly OrganizationOffice[] = [
  {
    name: "Columbia Center",
    streetAddress: "Suite 3200, 701 5th Avenue, Columbia Center",
    addressLocality: "Seattle",
    addressRegion: "WA",
    postalCode: "98104",
    addressCountry: "US",
  },
  {
    name: "Sathorn Square Tower",
    streetAddress: "Unit 2801, 28th Floor, Sathorn Square Tower, 98 North Sathorn Road, Silom, Bang Rak",
    addressLocality: "Bangkok",
    postalCode: "10500",
    addressCountry: "TH",
  },
  {
    name: "One Raffles Place",
    streetAddress: "#25-01, One Raffles Place, Tower 1, 1 Raffles Place",
    addressLocality: "Singapore",
    postalCode: "048616",
    addressCountry: "SG",
  },
  {
    name: "22 Bishopsgate",
    streetAddress: "Level 18, 22 Bishopsgate",
    addressLocality: "London",
    postalCode: "EC2N 4AJ",
    addressCountry: "GB",
  },
];

export function organizationPostalAddresses() {
  return ORGANIZATION_OFFICES.map((office) => ({
    "@type": "PostalAddress" as const,
    streetAddress: office.streetAddress,
    addressLocality: office.addressLocality,
    ...(office.addressRegion ? { addressRegion: office.addressRegion } : {}),
    postalCode: office.postalCode,
    addressCountry: office.addressCountry,
  }));
}

export function organizationLocations() {
  return ORGANIZATION_OFFICES.map((office) => ({
    "@type": "Place" as const,
    name: office.name,
    address: {
      "@type": "PostalAddress" as const,
      streetAddress: office.streetAddress,
      addressLocality: office.addressLocality,
      ...(office.addressRegion ? { addressRegion: office.addressRegion } : {}),
      postalCode: office.postalCode,
      addressCountry: office.addressCountry,
    },
  }));
}
