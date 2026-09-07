import { ALL_COUNTRIES, resolveCountry, resolveStateAbbreviation } from "@/lib/social-proof/geo/countries";
import checkoutSubdivisions from "./checkout-subdivisions.json";

export type CheckoutCountry = { code: string; name: string };
export type CheckoutSubdivision = { code: string; name: string };

/** WooCommerce i18n/states.php — preferred names/codes for common checkout countries. */
const WOO_SUBDIVISIONS = checkoutSubdivisions as Record<string, CheckoutSubdivision[]>;

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

function subdivisionCodeVariants(countryCode: string, raw: string) {
  const country = countryCode.trim().toUpperCase();
  const upper = raw.trim().toUpperCase();
  const withoutPrefix = upper.startsWith(`${country}-`) ? upper.slice(country.length + 1) : upper;
  return new Set([upper, withoutPrefix, `${country}-${withoutPrefix}`]);
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
  const resolved = normalizeCheckoutCountry(countryCode);
  const code = resolved || countryCode.trim().toUpperCase();
  if (code === "GB") return GB_NATIONS;

  const woo = WOO_SUBDIVISIONS[code];
  if (woo?.length) return woo.map((entry) => ({ code: entry.code, name: entry.name }));

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
  const code = country?.code ?? countryCode.trim().toUpperCase();
  const subdivisions = getCheckoutSubdivisions(code);
  if (!subdivisions.length) return trimmed.slice(0, 80);

  const variants = subdivisionCodeVariants(code, trimmed);
  const byCode = subdivisions.find((entry) =>
    [...subdivisionCodeVariants(code, entry.code)].some((variant) => variants.has(variant)),
  );
  if (byCode) return byCode.code;

  const byName = subdivisions.find((entry) => {
    const entryName = stripParenName(entry.name).toLowerCase();
    const inputName = stripParenName(trimmed).toLowerCase();
    return entry.name.toLowerCase() === trimmed.toLowerCase() || entryName === inputName;
  });
  if (byName) return byName.code;

  if (country) {
    const fromIso = resolveStateAbbreviation(country, trimmed);
    if (fromIso) {
      const isoVariants = subdivisionCodeVariants(code, fromIso);
      const match = subdivisions.find((entry) =>
        [...subdivisionCodeVariants(code, entry.code)].some((variant) => isoVariants.has(variant)),
      );
      if (match) return match.code;
    }
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
