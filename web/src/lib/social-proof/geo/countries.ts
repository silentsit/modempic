import iso3166 from "./iso-3166-2.json" with { type: "json" };

type IsoCountry = {
  name: string;
  divisions: Record<string, string>;
};

const ISO = iso3166 as Record<string, IsoCountry>;

export type GeoState = {
  code: string;
  name: string;
};

export type GeoCountry = {
  code: string;
  name: string;
  states: GeoState[];
};

const DISPLAY_NAME_OVERRIDES: Record<string, string> = {
  KR: "South Korea",
  VN: "Vietnam",
  CZ: "Czechia",
};

/** 50 countries used in synthetic name + location toasts. */
export const ROTATION_COUNTRY_CODES = [
  "US",
  "GB",
  "CN",
  "JP",
  "KR",
  "SG",
  "TH",
  "VN",
  "AE",
  "SA",
  "QA",
  "KW",
  "BH",
  "OM",
  "JO",
  "IL",
  "EG",
  "TR",
  "CA",
  "AU",
  "DE",
  "FR",
  "IT",
  "ES",
  "NL",
  "SE",
  "NO",
  "IN",
  "ID",
  "MY",
  "RO",
  "BR",
  "MX",
  "AR",
  "ZA",
  "NZ",
  "IE",
  "PL",
  "CH",
  "BE",
  "PT",
  "GR",
  "DK",
  "FI",
  "AT",
  "CZ",
  "NG",
  "KE",
  "CO",
  "CL",
] as const;

function stateAbbreviation(countryCode: string, divisionKey: string): string {
  const prefix = `${countryCode}-`;
  if (divisionKey.toUpperCase().startsWith(prefix)) {
    return divisionKey.slice(prefix.length).toUpperCase();
  }
  return divisionKey.toUpperCase();
}

function displayCountryName(code: string, officialName: string): string {
  return DISPLAY_NAME_OVERRIDES[code] ?? officialName;
}

function buildCountry(code: string): GeoCountry | null {
  const row = ISO[code];
  if (!row) return null;
  const states = Object.entries(row.divisions ?? {}).map(([key, name]) => ({
    code: stateAbbreviation(code, key),
    name,
  }));
  if (!states.length) {
    states.push({ code, name: row.name });
  }
  return {
    code,
    name: displayCountryName(code, row.name),
    states,
  };
}

export const ALL_COUNTRIES: GeoCountry[] = Object.keys(ISO)
  .sort()
  .map((code) => buildCountry(code))
  .filter((c): c is GeoCountry => c != null);

const COUNTRY_BY_CODE = new Map(ALL_COUNTRIES.map((c) => [c.code, c]));
const COUNTRY_BY_NAME = new Map(ALL_COUNTRIES.map((c) => [c.name.toLowerCase(), c]));

for (const [code, name] of Object.entries(DISPLAY_NAME_OVERRIDES)) {
  const country = COUNTRY_BY_CODE.get(code);
  if (country) COUNTRY_BY_NAME.set(name.toLowerCase(), country);
}

COUNTRY_BY_NAME.set("united states of america", COUNTRY_BY_CODE.get("US")!);
COUNTRY_BY_NAME.set("usa", COUNTRY_BY_CODE.get("US")!);
COUNTRY_BY_NAME.set("uk", COUNTRY_BY_CODE.get("GB")!);
COUNTRY_BY_NAME.set("great britain", COUNTRY_BY_CODE.get("GB")!);
COUNTRY_BY_NAME.set("korea", COUNTRY_BY_CODE.get("KR")!);
COUNTRY_BY_NAME.set("korea (south)", COUNTRY_BY_CODE.get("KR")!);
COUNTRY_BY_NAME.set("viet nam", COUNTRY_BY_CODE.get("VN")!);

export const ROTATION_COUNTRIES: GeoCountry[] = ROTATION_COUNTRY_CODES.map((code) => {
  const country = COUNTRY_BY_CODE.get(code);
  if (!country) {
    throw new Error(`ISO 3166-2 is missing rotation country ${code}`);
  }
  return country;
});

export function resolveCountry(input?: string | null): GeoCountry | null {
  const raw = input?.replace(/\s+/g, " ").trim();
  if (!raw) return null;
  const upper = raw.toUpperCase();
  if (COUNTRY_BY_CODE.has(upper)) return COUNTRY_BY_CODE.get(upper) ?? null;
  return COUNTRY_BY_NAME.get(raw.toLowerCase()) ?? null;
}

export function resolveStateAbbreviation(country: GeoCountry, state?: string | null): string | null {
  const raw = state?.replace(/\s+/g, " ").trim();
  if (!raw) return null;
  const upper = raw.toUpperCase();
  const withoutPrefix = upper.startsWith(`${country.code}-`) ? upper.slice(country.code.length + 1) : upper;
  const byCode = country.states.find((s) => s.code === withoutPrefix || s.code === upper);
  if (byCode) return byCode.code;
  const byName = country.states.find((s) => s.name.toLowerCase() === raw.toLowerCase());
  return byName?.code ?? null;
}

/**
 * Public toast location: country name only.
 * Accepts a stored `Country, ST` line and strips the region.
 */
export function formatCountryStateLine(country?: string | null, _state?: string | null): string | null {
  const raw = country?.replace(/\s+/g, " ").trim();
  if (!raw) return null;
  const resolved = resolveCountry(raw) ?? resolveCountry(raw.split(",")[0]?.trim());
  return resolved?.name ?? null;
}

export function pickRandomRotationLocation(): { countryName: string; locationLine: string } {
  const country = ROTATION_COUNTRIES[Math.floor(Math.random() * ROTATION_COUNTRIES.length)]!;
  return {
    countryName: country.name,
    locationLine: country.name,
  };
}
