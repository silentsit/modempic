"use client";

import { useEffect, useActionState, useRef, useState } from "react";
import { submitCheckoutAction, type CheckoutState } from "@/lib/actions/checkout";
import { CHECKOUT_FORM_ID } from "./checkout-form-id";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { US_STATES } from "@/lib/checkout/us-states";
import { CryptoAsset } from "@prisma/client";
import type { CryptoCheckoutProvider } from "@/lib/payments/crypto-provider";
import { CreditCard, Lock } from "lucide-react";
import { cryptoAssetCheckoutLabel } from "@/lib/payments/accepted-crypto-assets";
import { CheckoutCryptoReassurance } from "./checkout-crypto-reassurance";

const inputCls =
  "mt-1.5 h-11 rounded-xl border-input bg-card text-base transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background sm:text-sm";

const sectionCls = "rounded-2xl border border-border bg-card p-6 sm:p-8";

const CHECKOUT_DRAFT_KEY = "modempic-checkout-draft";

type CheckoutDraft = {
  fields: Record<string, string>;
  shipDifferent: boolean;
};

function readCheckoutDraft(): CheckoutDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(CHECKOUT_DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CheckoutDraft;
    if (!parsed?.fields || typeof parsed.fields !== "object") return null;
    return parsed;
  } catch {
    return null;
  }
}

function saveCheckoutDraft(form: HTMLFormElement, shipDifferent: boolean) {
  const fields: Record<string, string> = {};
  const fd = new FormData(form);
  fd.forEach((value, key) => {
    if (typeof value === "string") fields[key] = value;
  });
  sessionStorage.setItem(CHECKOUT_DRAFT_KEY, JSON.stringify({ fields, shipDifferent } satisfies CheckoutDraft));
}

function clearCheckoutDraft() {
  sessionStorage.removeItem(CHECKOUT_DRAFT_KEY);
}

function applyCheckoutDraft(form: HTMLFormElement, draft: CheckoutDraft) {
  for (const [name, value] of Object.entries(draft.fields)) {
    const el = form.elements.namedItem(name);
    if (el instanceof HTMLInputElement) {
      if (el.type === "checkbox") el.checked = value === "on";
      else el.value = value;
    } else if (el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement) {
      el.value = value;
    }
  }
}

function defaultSelectedAsset(assets: CryptoAsset[]): CryptoAsset {
  if (assets.includes(CryptoAsset.USDT)) return CryptoAsset.USDT;
  if (assets.includes(CryptoAsset.BTC)) return CryptoAsset.BTC;
  return assets[0] ?? CryptoAsset.USDT;
}

function providerHint(provider: CryptoCheckoutProvider | null): string | null {
  if (provider === "paymento") return "via Paymento";
  return null;
}

export function CheckoutForm({
  assets,
  userDisplayName,
  userEmail,
  assetProviders,
  cardEnabled,
}: {
  assets: CryptoAsset[];
  userDisplayName: string;
  userEmail: string;
  assetProviders: Record<CryptoAsset, CryptoCheckoutProvider>;
  cardEnabled: boolean;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const draftRestored = useRef(false);
  const [state, action, pending] = useActionState(submitCheckoutAction, null as CheckoutState);
  const [shipDifferent, setShipDifferent] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"CARD_ONRAMP" | "CRYPTO">(
    cardEnabled ? "CARD_ONRAMP" : "CRYPTO",
  );
  const [selectedAsset, setSelectedAsset] = useState<CryptoAsset>(() => defaultSelectedAsset(assets));
  const providerForAsset = assetProviders[selectedAsset] ?? null;
  const cryptoAvailable = assets.length > 0;

  useEffect(() => {
    const draft = readCheckoutDraft();
    if (!draft || draftRestored.current || !formRef.current) return;
    applyCheckoutDraft(formRef.current, draft);
    setShipDifferent(draft.shipDifferent);
    const method = draft.fields.paymentMethod;
    if (method === "CARD_ONRAMP" && cardEnabled) setPaymentMethod("CARD_ONRAMP");
    else if (method === "CRYPTO" && cryptoAvailable) setPaymentMethod("CRYPTO");
    const asset = draft.fields.asset;
    if (asset && assets.includes(asset as CryptoAsset)) {
      setSelectedAsset(asset as CryptoAsset);
    }
    draftRestored.current = true;
  }, [assets, cardEnabled, cryptoAvailable]);

  useEffect(() => {
    if (!state) return;
    if ("redirectTo" in state && typeof state.redirectTo === "string") {
      clearCheckoutDraft();
      window.location.assign(state.redirectTo);
    }
  }, [state]);

  return (
    <form
      id={CHECKOUT_FORM_ID}
      ref={formRef}
      action={action}
      className="space-y-8"
      onSubmit={(e) => {
        saveCheckoutDraft(e.currentTarget, shipDifferent);
      }}
    >
      {state && "error" in state && state.error ? (
        <p className="rounded-2xl border border-destructive/25 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {state.error}
        </p>
      ) : null}

      <section className={sectionCls}>
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">Step 1 of 2</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Signed in as{" "}
          <span className="font-semibold text-foreground">{userDisplayName || "Customer"}</span>{" "}
          <span className="text-muted-foreground">({userEmail})</span>
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          Order confirmations and payment updates are sent to this email.
        </p>
      </section>

      <fieldset className={`space-y-4 ${sectionCls}`}>
        <legend className="text-lg font-semibold tracking-tight text-foreground">Shipping & billing</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="billFirstName">First name</Label>
            <Input
              id="billFirstName"
              name="billFirstName"
              required
              className={inputCls}
              autoComplete="billing given-name"
            />
          </div>
          <div>
            <Label htmlFor="billLastName">Last name</Label>
            <Input id="billLastName" name="billLastName" required className={inputCls} autoComplete="billing family-name" />
          </div>
        </div>
        <div>
          <Label htmlFor="billCompany">Company name (optional)</Label>
          <Input id="billCompany" name="billCompany" className={inputCls} autoComplete="organization" />
        </div>
        <div>
          <Label htmlFor="billCountry">Country / Region</Label>
          <select
            id="billCountry"
            name="billCountry"
            className={`${inputCls} w-full px-3`}
            defaultValue="US"
            autoComplete="billing country"
          >
            <option value="US">United States (US)</option>
          </select>
        </div>
        <div>
          <Label htmlFor="billLine1">Street address</Label>
          <Input
            id="billLine1"
            name="billLine1"
            required
            className={inputCls}
            autoComplete="billing address-line1"
            placeholder="House number and street name"
          />
        </div>
        <div>
          <Label htmlFor="billLine2">Apartment, suite, unit, etc. (optional)</Label>
          <Input id="billLine2" name="billLine2" className={inputCls} autoComplete="billing address-line2" />
        </div>
        <div className="grid gap-4 sm:grid-cols-6">
          <div className="sm:col-span-2">
            <Label htmlFor="billCity">Town / City</Label>
            <Input id="billCity" name="billCity" required className={inputCls} autoComplete="billing address-level2" />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="billState">State</Label>
            <select
              id="billState"
              name="billState"
              required
              className={`${inputCls} w-full px-3`}
              defaultValue=""
              autoComplete="billing address-level1"
            >
              <option value="" disabled>
                Select state
              </option>
              {US_STATES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="billPostal">ZIP Code</Label>
            <Input id="billPostal" name="billPostal" required className={inputCls} autoComplete="billing postal-code" />
          </div>
        </div>
        <div>
          <Label htmlFor="billPhone">Phone</Label>
          <Input id="billPhone" name="billPhone" type="tel" className={inputCls} autoComplete="billing tel" />
        </div>

        <div className="flex items-start gap-3 pt-2">
          <input
            type="checkbox"
            name="shipDifferent"
            id="shipDifferent"
            checked={shipDifferent}
            onChange={(e) => setShipDifferent(e.target.checked)}
            className="mt-1 h-4 w-4 rounded border-input accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
          />
          <Label htmlFor="shipDifferent" className="font-normal leading-snug">
            Ship to a different address?
          </Label>
        </div>

        {shipDifferent ? (
          <div className="space-y-4 border-t border-border pt-6">
            <p className="text-sm font-semibold text-foreground">Shipping address</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="shipFirstName">First name</Label>
                <Input
                  id="shipFirstName"
                  name="shipFirstName"
                  required={shipDifferent}
                  className={inputCls}
                  autoComplete="shipping given-name"
                />
              </div>
              <div>
                <Label htmlFor="shipLastName">Last name</Label>
                <Input
                  id="shipLastName"
                  name="shipLastName"
                  required={shipDifferent}
                  className={inputCls}
                  autoComplete="shipping family-name"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="shipCompany">Company name (optional)</Label>
              <Input id="shipCompany" name="shipCompany" className={inputCls} autoComplete="shipping organization" />
            </div>
            <div>
              <Label htmlFor="shipCountry">Country / Region</Label>
              <select id="shipCountry" name="shipCountry" className={`${inputCls} w-full px-3`} defaultValue="US">
                <option value="US">United States (US)</option>
              </select>
            </div>
            <div>
              <Label htmlFor="shipLine1">Street address</Label>
              <Input
                id="shipLine1"
                name="shipLine1"
                required={shipDifferent}
                className={inputCls}
                autoComplete="shipping address-line1"
              />
            </div>
            <div>
              <Label htmlFor="shipLine2">Apartment, suite, unit, etc. (optional)</Label>
              <Input id="shipLine2" name="shipLine2" className={inputCls} autoComplete="shipping address-line2" />
            </div>
            <div className="grid gap-4 sm:grid-cols-6">
              <div className="sm:col-span-2">
                <Label htmlFor="shipCity">Town / City</Label>
                <Input id="shipCity" name="shipCity" required={shipDifferent} className={inputCls} autoComplete="shipping address-level2" />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="shipState">State</Label>
                <select
                  id="shipState"
                  name="shipState"
                  required={shipDifferent}
                  className={`${inputCls} w-full px-3`}
                  defaultValue=""
                >
                  <option value="" disabled>
                    Select state
                  </option>
                  {US_STATES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="shipPostal">ZIP Code</Label>
                <Input id="shipPostal" name="shipPostal" required={shipDifferent} className={inputCls} autoComplete="shipping postal-code" />
              </div>
            </div>
            <div>
              <Label htmlFor="shipPhone">Phone</Label>
              <Input id="shipPhone" name="shipPhone" type="tel" className={inputCls} autoComplete="shipping tel" />
            </div>
          </div>
        ) : null}
      </fieldset>

      <fieldset className={sectionCls}>
        <legend className="text-lg font-semibold tracking-tight text-foreground">Additional information</legend>
        <div className="mt-4">
          <Label htmlFor="orderNotes">Notes about your order (optional)</Label>
          <Textarea
            id="orderNotes"
            name="orderNotes"
            rows={4}
            className="mt-1.5 rounded-xl border-input bg-card text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background"
            placeholder="Delivery instructions, scheduling, or other notes."
          />
        </div>
      </fieldset>

      <div className="space-y-4">
        <fieldset className={`space-y-5 ${sectionCls}`}>
          <legend className="text-lg font-semibold tracking-tight text-foreground">Payment (step 2 of 2)</legend>

          <div className="space-y-4">
            <input type="hidden" name="paymentMethod" value={paymentMethod} />
            {cardEnabled ? (
              <label
                className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition-colors ${
                  paymentMethod === "CARD_ONRAMP"
                    ? "border-primary/30 bg-primary-subtle"
                    : "border-border bg-card hover:border-primary/20"
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethodChoice"
                  className="sr-only"
                  checked={paymentMethod === "CARD_ONRAMP"}
                  onChange={() => setPaymentMethod("CARD_ONRAMP")}
                />
                <span
                  className={`mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                    paymentMethod === "CARD_ONRAMP" ? "bg-primary" : "border border-border bg-background"
                  }`}
                  aria-hidden
                >
                  {paymentMethod === "CARD_ONRAMP" ? (
                    <span className="h-2 w-2 rounded-full bg-primary-foreground" />
                  ) : null}
                </span>
                <span className="flex-1">
                  <span className="flex items-center gap-2 font-medium text-foreground">
                    <CreditCard className="h-4 w-4" strokeWidth={1.75} aria-hidden />
                    Pay with card
                    <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary-foreground">
                      Default
                    </span>
                  </span>
                  <span className="mt-1 block text-sm text-muted-foreground">
                    Apple Pay, Google Pay, Visa, Mastercard, and Amex on a hosted checkout. We never store card numbers
                    on this site.
                  </span>
                </span>
              </label>
            ) : null}

            {cryptoAvailable ? (
              <label
                className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition-colors ${
                  paymentMethod === "CRYPTO"
                    ? "border-primary/30 bg-primary-subtle"
                    : "border-border bg-card hover:border-primary/20"
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethodChoice"
                  className="sr-only"
                  checked={paymentMethod === "CRYPTO"}
                  onChange={() => setPaymentMethod("CRYPTO")}
                />
                <span
                  className={`mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                    paymentMethod === "CRYPTO" ? "bg-primary" : "border border-border bg-background"
                  }`}
                  aria-hidden
                >
                  {paymentMethod === "CRYPTO" ? (
                    <span className="h-2 w-2 rounded-full bg-primary-foreground" />
                  ) : null}
                </span>
                <span className="flex-1">
                  <span className="flex items-center gap-2 font-medium text-foreground">
                    <span className="text-lg leading-none" aria-hidden>
                      ₿
                    </span>
                    Pay with cryptocurrency
                  </span>
                  <span className="mt-1 block text-sm text-muted-foreground">
                    Optional. Complete payment on Paymento&apos;s secure page and select your coin and network there.
                  </span>
                </span>
              </label>
            ) : null}

            {paymentMethod === "CRYPTO" && cryptoAvailable ? (
              <div>
                <Label htmlFor="asset">Preferred crypto asset</Label>
                <input type="hidden" name="asset" value={selectedAsset} />
                <select
                  id="asset"
                  className={`${inputCls} mt-1.5 w-full px-3`}
                  value={selectedAsset}
                  onChange={(e) => setSelectedAsset(e.target.value as CryptoAsset)}
                  aria-label="Preferred crypto asset"
                >
                  {assets.map((a) => (
                    <option key={a} value={a}>
                      {cryptoAssetCheckoutLabel(a)}
                    </option>
                  ))}
                </select>
                {providerHint(providerForAsset) ? (
                  <p className="mt-1.5 text-xs text-muted-foreground">Checkout {providerHint(providerForAsset)}</p>
                ) : null}
              </div>
            ) : (
              <input type="hidden" name="asset" value={selectedAsset} />
            )}

            {paymentMethod === "CRYPTO" ? <CheckoutCryptoReassurance /> : null}
          </div>
        </fieldset>

        <Button
          type="submit"
          size="lg"
          disabled={pending}
          className="h-14 w-full gap-2 text-base font-semibold"
        >
          {pending ? (
            "Placing order…"
          ) : (
            <>
              <Lock className="h-4 w-4" strokeWidth={2.5} aria-hidden />
              {paymentMethod === "CARD_ONRAMP" ? "Pay with card" : "Pay with crypto"}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
