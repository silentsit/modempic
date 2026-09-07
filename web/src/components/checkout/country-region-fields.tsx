"use client";

import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CHECKOUT_DRAFT_KEY } from "@/lib/checkout/checkout-draft";
import {
  CHECKOUT_COUNTRIES,
  getCheckoutSubdivisions,
  getPostalLabel,
  getSubdivisionLabel,
  getSubdivisionPlaceholder,
  hasSubdivisionSelect,
  normalizeCheckoutCountry,
  normalizeSubdivision,
} from "@/lib/checkout/checkout-geo";

type FieldNames = {
  country: string;
  city: string;
  state: string;
  postal: string;
};

type Props = {
  idPrefix: string;
  fields: FieldNames;
  required: boolean;
  autoCompleteGroup?: "billing" | "shipping";
  inputClassName: string;
  defaultCountry?: string;
};

function readDraftValue(name: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(CHECKOUT_DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { fields?: Record<string, string> };
    const value = parsed.fields?.[name];
    return typeof value === "string" && value ? value : null;
  } catch {
    return null;
  }
}

function autoComplete(group: Props["autoCompleteGroup"], token: string) {
  return group ? `${group} ${token}` : token;
}

export function CountryRegionFields({
  idPrefix,
  fields,
  required,
  autoCompleteGroup,
  inputClassName,
  defaultCountry = "US",
}: Props) {
  const countryRef = useRef<HTMLSelectElement>(null);
  const countryValueRef = useRef(defaultCountry);
  const [country, setCountry] = useState(defaultCountry);
  const [region, setRegion] = useState("");
  const subdivisions = getCheckoutSubdivisions(country);
  const useSelect = hasSubdivisionSelect(country);
  const regionLabel = getSubdivisionLabel(country);
  const postalLabel = getPostalLabel(country);

  const applyCountry = (raw: string, options?: { clearRegion?: boolean }) => {
    const next = normalizeCheckoutCountry(raw);
    if (!next || next === countryValueRef.current) return;
    countryValueRef.current = next;
    setCountry(next);
    if (options?.clearRegion !== false) setRegion("");
  };

  useEffect(() => {
    const savedCountry = normalizeCheckoutCountry(readDraftValue(fields.country) ?? "");
    const savedRegion = readDraftValue(fields.state);
    if (savedCountry) {
      countryValueRef.current = savedCountry;
      setCountry(savedCountry);
      if (savedRegion) {
        const normalized = normalizeSubdivision(savedCountry, savedRegion);
        setRegion(normalized || (hasSubdivisionSelect(savedCountry) ? "" : savedRegion));
      }
    } else if (savedRegion) {
      setRegion(savedRegion);
    }
  }, [fields.country, fields.state]);

  useEffect(() => {
    const el = countryRef.current;
    if (!el) return;

    const syncFromDom = (clearRegion: boolean) => {
      applyCountry(el.value, { clearRegion });
    };

    const onUserChange = () => syncFromDom(true);
    el.addEventListener("input", onUserChange);
    el.addEventListener("change", onUserChange);

    const catchUp = window.setTimeout(() => syncFromDom(false), 0);
    const catchUpLate = window.setTimeout(() => syncFromDom(false), 300);

    return () => {
      el.removeEventListener("input", onUserChange);
      el.removeEventListener("change", onUserChange);
      window.clearTimeout(catchUp);
      window.clearTimeout(catchUpLate);
    };
  }, [fields.country]);

  return (
    <>
      <div>
        <Label htmlFor={`${idPrefix}-country`}>Country / region</Label>
        <select
          ref={countryRef}
          id={`${idPrefix}-country`}
          name={fields.country}
          required={required}
          className={`${inputClassName} w-full px-3`}
          value={country}
          autoComplete={autoComplete(autoCompleteGroup, "country")}
          onChange={(event) => applyCountry(event.target.value)}
          onInput={(event) => applyCountry((event.target as HTMLSelectElement).value)}
        >
          {CHECKOUT_COUNTRIES.map((entry) => (
            <option key={entry.code} value={entry.code}>
              {entry.name}
            </option>
          ))}
        </select>
      </div>
      <div className="grid gap-4 sm:grid-cols-6">
        <div className="sm:col-span-2">
          <Label htmlFor={`${idPrefix}-city`}>Town / city</Label>
          <Input
            id={`${idPrefix}-city`}
            name={fields.city}
            required={required}
            className={inputClassName}
            autoComplete={autoComplete(autoCompleteGroup, "address-level2")}
          />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor={`${idPrefix}-state`}>{regionLabel}</Label>
          {useSelect ? (
            <select
              key={`${idPrefix}-region-${country}`}
              id={`${idPrefix}-state`}
              name={fields.state}
              required={required}
              className={`${inputClassName} w-full px-3`}
              value={region}
              autoComplete={autoComplete(autoCompleteGroup, "address-level1")}
              onChange={(event) => setRegion(event.target.value)}
            >
              <option value="" disabled>
                {getSubdivisionPlaceholder(country)}
              </option>
              {subdivisions.map((entry) => (
                <option key={entry.code} value={entry.code}>
                  {entry.name}
                </option>
              ))}
            </select>
          ) : (
            <Input
              key={`${idPrefix}-region-text-${country}`}
              id={`${idPrefix}-state`}
              name={fields.state}
              className={inputClassName}
              value={region}
              placeholder={country ? regionLabel : "Select a country first"}
              autoComplete={autoComplete(autoCompleteGroup, "address-level1")}
              onChange={(event) => setRegion(event.target.value)}
            />
          )}
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor={`${idPrefix}-postal`}>{postalLabel}</Label>
          <Input
            id={`${idPrefix}-postal`}
            name={fields.postal}
            required={required}
            className={inputClassName}
            autoComplete={autoComplete(autoCompleteGroup, "postal-code")}
          />
        </div>
      </div>
    </>
  );
}
