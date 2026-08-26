import { ALL_COUNTRIES, resolveCountry, resolveStateAbbreviation } from "@/lib/social-proof/geo/countries";

export type CheckoutCountry = { code: string; name: string };
export type CheckoutSubdivision = { code: string; name: string };

/** UK checkout uses nations, not the 200+ ISO council areas. */
const GB_NATIONS: CheckoutSubdivision[] = [
  { code: "ENG", name: "England" },
  { code: "NIR", name: "Northern Ireland" },
  { code: "SCT", name: "Scotland" },
  { code: "WLS", name: "Wales" },
];

const US_MILITARY: CheckoutSubdivision[] = [
  { code: "AA", name: "Armed Forces (AA)" },
  { code: "AE", name: "Armed Forces (AE)" },
  { code: "AP", name: "Armed Forces (AP)" },
];

function stripParenName(name: string) {
  return name.replace(/\s*\([^)]*\)\s*$/, "").trim();
}

export const CHECKOUT_COUNTRIES: CheckoutCountry[] = ALL_COUNTRIES.map((country) => ({
  code: country.code,
  name: country.name,
})).sort((a, b) => {
  if (a.code === "US") return -1;
  if (b.code === "US") return 1;
  return a.name.localeCompare(b.name);
});

const COUNTRY_CODES = new Set(CHECKOUT_COUNTRIES.map((c) => c.code));

export function isCheckoutCountry(code: string) {
  return COUNTRY_CODES.has(code.trim().toUpperCase());
}

export function normalizeCheckoutCountry(code: string) {
  return resolveCountry(code)?.code ?? "";
}

export function getCheckoutSubdivisions(countryCode: string): CheckoutSubdivision[] {
  const code = countryCode.trim().toUpperCase();
  if (code === "GB") return GB_NATIONS;

  const country = resolveCountry(code);
  if (!country) return [];

  const placeholderOnly =
    country.states.length === 1 &&
    (country.states[0]?.code === country.code || country.states[0]?.name === country.name);
  if (placeholderOnly) return [];

  const states = country.states.map((state) => ({
    code: state.code,
    name: stripParenName(state.name),
  }));

  if (code === "US") return [...states, ...US_MILITARY];
  return states;
}

export function hasSubdivisionSelect(countryCode: string) {
  return getCheckoutSubdivisions(countryCode).length > 0;
}

export function getSubdivisionLabel(countryCode: string) {
  switch (countryCode.trim().toUpperCase()) {
    case "US":
    case "MX":
    case "IN":
    case "BR":
    case "DE":
      return "State";
    case "CA":
    case "TH":
    case "ID":
    case "CN":
      return "Province";
    case "AU":
      return "State / territory";
    case "GB":
      return "Country";
    case "JP":
      return "Prefecture";
    default:
      return "State / province";
  }
}

export function getSubdivisionPlaceholder(countryCode: string) {
  switch (countryCode.trim().toUpperCase()) {
    case "US":
    case "MX":
    case "IN":
    case "BR":
    case "DE":
      return "Select a state";
    case "CA":
    case "TH":
    case "ID":
    case "CN":
      return "Select a province";
    case "AU":
      return "Select a state / territory";
    case "GB":
      return "Select a country";
    case "JP":
      return "Select a prefecture";
    default:
      return "Select a state / province";
  }
}

export function getPostalLabel(countryCode: string) {
  switch (countryCode.trim().toUpperCase()) {
    case "US":
      return "ZIP code";
    case "GB":
    case "IE":
    case "AU":
    case "NZ":
      return "Postcode";
    case "CA":
      return "Postal code";
    default:
      return "Postal code";
  }
}

export function normalizeSubdivision(countryCode: string, value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  const country = resolveCountry(countryCode);
  const subdivisions = getCheckoutSubdivisions(countryCode);
  if (!subdivisions.length) return trimmed.slice(0, 80);

  const upper = trimmed.toUpperCase();
  const byCode = subdivisions.find((entry) => entry.code.toUpperCase() === upper);
  if (byCode) return byCode.code;

  const byName = subdivisions.find((entry) => entry.name.toLowerCase() === trimmed.toLowerCase());
  if (byName) return byName.code;

  if (country) {
    const fromIso = resolveStateAbbreviation(country, trimmed);
    const match = fromIso ? subdivisions.find((entry) => entry.code === fromIso) : null;
    if (match) return match.code;
  }

  return "";
}

export function isValidCheckoutRegion(countryCode: string, state: string) {
  const country = normalizeCheckoutCountry(countryCode);
  if (!country) return false;
  const subdivisions = getCheckoutSubdivisions(country);
  if (!subdivisions.length) return true;
  return Boolean(normalizeSubdivision(country, state));
}

export function parseCheckoutRegion(countryRaw: string, stateRaw: string) {
  const country = normalizeCheckoutCountry(countryRaw);
  if (!country) return null;
  const subdivisions = getCheckoutSubdivisions(country);
  if (!subdivisions.length) {
    return { country, state: stateRaw.trim().slice(0, 80) };
  }
  const state = normalizeSubdivision(country, stateRaw);
  if (!state) return null;
  return { country, state };
}
