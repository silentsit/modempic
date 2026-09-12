"use client";

import { useEffect, useActionState, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { submitCheckoutAction, type CheckoutState } from "@/lib/actions/checkout";
import { CHECKOUT_FORM_ID } from "./checkout-form-id";
import { CHECKOUT_DRAFT_KEY } from "@/lib/checkout/checkout-draft";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CountryRegionFields } from "@/components/checkout/country-region-fields";
import { CryptoAsset } from "@prisma/client";
import type { CryptoCheckoutProvider } from "@/lib/payments/crypto-provider";
import { CreditCard, Lock, Wallet } from "lucide-react";
import { cryptoAssetCheckoutLabel } from "@/lib/payments/accepted-crypto-assets";
import {
  CheckoutPaymentReassurance,
  INSTANT_CARD_CHECKOUT_BADGE,
  INSTANT_CARD_CHECKOUT_DESCRIPTION_LINES,
  INSTANT_CARD_CHECKOUT_TITLE,
  MANUAL_CARD_CHECKOUT_BADGE,
  MANUAL_CARD_CHECKOUT_DESCRIPTION_LINES,
  MANUAL_CARD_CHECKOUT_TITLE,
} from "./checkout-crypto-reassurance";
import {
  CARD_CHECKOUT_STALL_MS,
  assignCardCheckoutTab,
  closeCardCheckoutTab,
  mintCardCheckoutFromBrowser,
  openCardCheckoutPlaceholder,
  showCardCheckoutError,
} from "@/lib/checkout/card-checkout-tab";

const inputCls =
  "mt-1.5 h-11 rounded-xl border-input bg-card text-base transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background sm:text-sm";

const sectionCls = "rounded-2xl border border-border bg-card p-6 sm:p-8";

type CheckoutPaymentMethod = "CRYPTO" | "CARD_ONRAMP" | "MANUAL_INVOICE";

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

function CheckoutMethodBadge({
  children,
  active = false,
}: {
  children: ReactNode;
  active?: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase leading-none tracking-wide ${
        active ? "bg-primary-subtle text-primary" : "bg-muted text-muted-foreground"
      }`}
    >
      {children}
    </span>
  );
}

function defaultCheckoutPaymentMethod(
  cardOnrampEnabled: boolean,
  manualCardCheckoutEnabled: boolean,
  hasCrypto: boolean,
): CheckoutPaymentMethod {
  if (cardOnrampEnabled) return "CARD_ONRAMP";
  if (manualCardCheckoutEnabled) return "MANUAL_INVOICE";
  if (hasCrypto) return "CRYPTO";
  return "MANUAL_INVOICE";
}

function methodPickerClass(active: boolean) {
  return `rounded-2xl border p-4 text-left transition-colors ${
    active
      ? "border-primary bg-primary-subtle ring-2 ring-primary/20"
      : "border-border bg-background hover:border-foreground/20"
  }`;
}

function submittedPaymentMethod(usingOnramp: boolean, usingManualCard: boolean): CheckoutPaymentMethod {
  if (usingOnramp) return "CARD_ONRAMP";
  if (usingManualCard) return "MANUAL_INVOICE";
  return "CRYPTO";
}

function submitButtonLabel(usingOnramp: boolean, usingManualCard: boolean) {
  if (usingOnramp || usingManualCard) return "Place order";
  return "Pay with crypto";
}

export function CheckoutForm({
  assets,
  userDisplayName,
  userEmail,
  signedIn = true,
  assetProviders,
  cardOnrampEnabled = false,
  manualCardCheckoutEnabled = true,
}: {
  assets: CryptoAsset[];
  userDisplayName: string;
  userEmail: string;
  signedIn?: boolean;
  assetProviders: Record<CryptoAsset, CryptoCheckoutProvider>;
  cardOnrampEnabled?: boolean;
  manualCardCheckoutEnabled?: boolean;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const draftRestored = useRef(false);
  const cardTabRef = useRef<Window | null>(null);
  const cardHandoffStarted = useRef(false);
  const [state, action, pending] = useActionState(submitCheckoutAction, null as CheckoutState);
  const [stallError, setStallError] = useState<string | null>(null);
  const [shipDifferent, setShipDifferent] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<CryptoAsset>(() => defaultSelectedAsset(assets));
  const [paymentMethod, setPaymentMethod] = useState<CheckoutPaymentMethod>(() =>
    defaultCheckoutPaymentMethod(cardOnrampEnabled, manualCardCheckoutEnabled, assets.length > 0),
  );
  const providerForAsset = assetProviders[selectedAsset] ?? null;
  const usingOnramp = cardOnrampEnabled && paymentMethod === "CARD_ONRAMP";
  const usingManualCard = manualCardCheckoutEnabled && paymentMethod === "MANUAL_INVOICE";
  const methodCount =
    Number(cardOnrampEnabled) + Number(manualCardCheckoutEnabled) + Number(assets.length > 0);
  const showMethodPicker = methodCount > 1;

  useEffect(() => {
    const draft = readCheckoutDraft();
    if (!draft || draftRestored.current || !formRef.current) return;
    applyCheckoutDraft(formRef.current, draft);
    setShipDifferent(draft.shipDifferent);
    const asset = draft.fields.asset;
    if (asset && assets.includes(asset as CryptoAsset)) {
      setSelectedAsset(asset as CryptoAsset);
    }
    const method = draft.fields.paymentMethod;
    if (method === "CARD_ONRAMP" && cardOnrampEnabled) setPaymentMethod("CARD_ONRAMP");
    if (method === "MANUAL_INVOICE" && manualCardCheckoutEnabled) setPaymentMethod("MANUAL_INVOICE");
    if (method === "CRYPTO" && assets.length > 0) setPaymentMethod("CRYPTO");
    draftRestored.current = true;
  }, [assets, cardOnrampEnabled, manualCardCheckoutEnabled]);

  useEffect(() => {
    if (!pending) return;
    const timer = window.setTimeout(() => {
      const message =
        "Checkout is taking too long. Stay on this Modempic tab. If an order was saved, open Your orders.";
      setStallError(message);
      if (usingOnramp) showCardCheckoutError(cardTabRef.current, message);
    }, CARD_CHECKOUT_STALL_MS);
    return () => window.clearTimeout(timer);
  }, [pending, usingOnramp]);

  useEffect(() => {
    if (!state) return;
    if ("error" in state && state.error) {
      showCardCheckoutError(cardTabRef.current, state.error);
      return;
    }
    if (!("redirectTo" in state) || typeof state.redirectTo !== "string") return;
    if (cardHandoffStarted.current) return;
    cardHandoffStarted.current = true;
    clearCheckoutDraft();

    const tab = cardTabRef.current;
    const redirectTo = state.redirectTo;

    if (state.mintCardCheckout && state.orderNumber) {
      const orderNumber = state.orderNumber;
      void (async () => {
        const minted = await mintCardCheckoutFromBrowser(orderNumber);
        if (minted.alreadyPaid) {
          closeCardCheckoutTab(tab);
        } else if (minted.url) {
          const opened = assignCardCheckoutTab(tab, minted.url);
          if (!opened) {
            showCardCheckoutError(
              tab,
              "Card checkout is ready, but this browser blocked the tab. Return to Modempic and use Open card checkout.",
            );
          }
        } else {
          showCardCheckoutError(
            tab,
            minted.error ?? "Could not open card checkout. Return to Modempic and try again.",
          );
        }
        window.location.assign(
          minted.url || minted.alreadyPaid
            ? redirectTo
            : `/checkout/payment?order=${encodeURIComponent(orderNumber)}`,
        );
      })();
      return;
    }

    if (state.cardCheckoutUrl) {
      assignCardCheckoutTab(tab, state.cardCheckoutUrl);
    } else if (state.cardCheckoutError) {
      showCardCheckoutError(tab, state.cardCheckoutError);
    } else {
      closeCardCheckoutTab(tab);
    }
    window.location.assign(redirectTo);
  }, [state]);

  return (
    <form
      id={CHECKOUT_FORM_ID}
      ref={formRef}
      action={action}
      className="space-y-8"
      onSubmit={(e) => {
        saveCheckoutDraft(e.currentTarget, shipDifferent);
        if (usingOnramp) {
          cardTabRef.current = openCardCheckoutPlaceholder();
        } else {
          closeCardCheckoutTab(cardTabRef.current);
          cardTabRef.current = null;
        }
      }}
    >
      {state && "error" in state && state.error ? (
        <p className="rounded-2xl border border-destructive/25 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {state.error}
        </p>
      ) : stallError ? (
        <p className="rounded-2xl border border-destructive/25 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {stallError}
        </p>
      ) : null}

      <section className={sectionCls}>
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">Step 1 of 2</p>
        {signedIn ? (
          <>
            <p className="mt-2 text-sm text-muted-foreground">
              Signed in as{" "}
              <span className="font-semibold text-foreground">{userDisplayName || "Customer"}</span>{" "}
              <span className="text-muted-foreground">({userEmail})</span>
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              Order confirmations and payment updates are sent to this email.
            </p>
          </>
        ) : (
          <>
            <p className="mt-2 text-sm text-muted-foreground">
              Guest checkout is available.{" "}
              <Link href="/login?callbackUrl=/checkout" className="font-medium text-accent underline-offset-2 hover:underline">
                Log in
              </Link>{" "}
              if you already have an account.
            </p>
            <div className="mt-4">
              <Label htmlFor="guestEmail">Email address</Label>
              <Input
                id="guestEmail"
                name="guestEmail"
                type="email"
                required
                className={inputCls}
                autoComplete="email"
              />
              <p className="mt-1.5 text-xs text-muted-foreground">Order confirmations and payment updates go here.</p>
            </div>
          </>
        )}
      </section>

      <fieldset className={`space-y-4 ${sectionCls}`}>
        <legend className="text-lg font-semibold tracking-tight text-foreground">Shipping & Billing</legend>
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
        <CountryRegionFields
          idPrefix="bill"
          required
          autoCompleteGroup="billing"
          inputClassName={inputCls}
          fields={{ country: "billCountry", city: "billCity", state: "billState", postal: "billPostal" }}
        />
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
            <CountryRegionFields
              idPrefix="ship"
              required={shipDifferent}
              autoCompleteGroup="shipping"
              inputClassName={inputCls}
              fields={{ country: "shipCountry", city: "shipCity", state: "shipState", postal: "shipPostal" }}
            />
            <div>
              <Label htmlFor="shipPhone">Phone</Label>
              <Input id="shipPhone" name="shipPhone" type="tel" className={inputCls} autoComplete="shipping tel" />
            </div>
          </div>
        ) : null}
      </fieldset>

      <fieldset className={sectionCls}>
        <legend className="text-lg font-semibold tracking-tight text-foreground">Additional Information</legend>
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
          <legend className="text-lg font-semibold tracking-tight text-foreground">Payment (Step 2 of 2)</legend>

          <input
            type="hidden"
            name="paymentMethod"
            value={submittedPaymentMethod(usingOnramp, usingManualCard)}
          />

          {showMethodPicker ? (
            <div className="grid gap-3" role="radiogroup" aria-label="Payment method">
              {cardOnrampEnabled ? (
                <button
                  type="button"
                  role="radio"
                  aria-label={`${INSTANT_CARD_CHECKOUT_TITLE}, Instant checkout`}
                  aria-checked={usingOnramp}
                  onClick={() => setPaymentMethod("CARD_ONRAMP")}
                  className={methodPickerClass(usingOnramp)}
                >
                  <span className="flex items-start gap-2 text-sm font-semibold text-foreground">
                    <CreditCard className="mt-0.5 h-4 w-4 shrink-0 text-primary" strokeWidth={2} aria-hidden />
                    <span className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1.5">
                      {INSTANT_CARD_CHECKOUT_TITLE}
                      <CheckoutMethodBadge active={usingOnramp}>{INSTANT_CARD_CHECKOUT_BADGE}</CheckoutMethodBadge>
                    </span>
                  </span>
                  <span className="mt-1.5 block whitespace-pre-line text-xs leading-relaxed text-muted-foreground">
                    {INSTANT_CARD_CHECKOUT_DESCRIPTION_LINES.join("\n")}
                  </span>
                </button>
              ) : null}
              {manualCardCheckoutEnabled ? (
                <button
                  type="button"
                  role="radio"
                  aria-label={`${MANUAL_CARD_CHECKOUT_TITLE}, Payment link by email`}
                  aria-checked={usingManualCard}
                  onClick={() => setPaymentMethod("MANUAL_INVOICE")}
                  className={methodPickerClass(usingManualCard)}
                >
                  <span className="flex items-start gap-2 text-sm font-semibold text-foreground">
                    <CreditCard className="mt-0.5 h-4 w-4 shrink-0 text-primary" strokeWidth={2} aria-hidden />
                    <span className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1.5">
                      {MANUAL_CARD_CHECKOUT_TITLE}
                      <CheckoutMethodBadge active={usingManualCard}>{MANUAL_CARD_CHECKOUT_BADGE}</CheckoutMethodBadge>
                    </span>
                  </span>
                  <span className="mt-1.5 block whitespace-pre-line text-xs leading-relaxed text-muted-foreground">
                    {MANUAL_CARD_CHECKOUT_DESCRIPTION_LINES.join("\n")}
                  </span>
                </button>
              ) : null}
              {assets.length > 0 ? (
                <button
                  type="button"
                  role="radio"
                  aria-label="Cryptocurrency"
                  aria-checked={paymentMethod === "CRYPTO"}
                  onClick={() => setPaymentMethod("CRYPTO")}
                  className={methodPickerClass(paymentMethod === "CRYPTO")}
                >
                  <span className="flex items-start gap-2 text-sm font-semibold text-foreground">
                    <Wallet className="mt-0.5 h-4 w-4 shrink-0 text-primary" strokeWidth={2} aria-hidden />
                    Cryptocurrency
                  </span>
                  <span className="mt-1.5 block text-xs leading-relaxed text-muted-foreground">
                    Send BTC, USDT, or another accepted asset on Paymento.
                  </span>
                </button>
              ) : null}
            </div>
          ) : usingOnramp ? (
            <p className="flex flex-wrap items-center gap-x-2 gap-y-1.5 text-sm font-semibold text-foreground">
              <CreditCard className="h-4 w-4 text-primary" strokeWidth={2} aria-hidden />
              {INSTANT_CARD_CHECKOUT_TITLE}
              <CheckoutMethodBadge active>{INSTANT_CARD_CHECKOUT_BADGE}</CheckoutMethodBadge>
            </p>
          ) : usingManualCard ? (
            <p className="flex flex-wrap items-center gap-x-2 gap-y-1.5 text-sm font-semibold text-foreground">
              <CreditCard className="h-4 w-4 text-primary" strokeWidth={2} aria-hidden />
              {MANUAL_CARD_CHECKOUT_TITLE}
              <CheckoutMethodBadge active>{MANUAL_CARD_CHECKOUT_BADGE}</CheckoutMethodBadge>
            </p>
          ) : null}

          {usingOnramp ? (
            showMethodPicker ? null : <CheckoutPaymentReassurance method="CARD_ONRAMP" />
          ) : usingManualCard ? (
            showMethodPicker ? null : <CheckoutPaymentReassurance method="MANUAL_INVOICE" />
          ) : (
            <>
              <div>
                <Label htmlFor="asset">Crypto asset</Label>
                <input type="hidden" name="asset" value={selectedAsset} />
                <select
                  id="asset"
                  className={`${inputCls} mt-1.5 w-full px-3`}
                  value={selectedAsset}
                  onChange={(e) => setSelectedAsset(e.target.value as CryptoAsset)}
                  aria-label="Crypto asset"
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

              <p className="text-sm leading-relaxed text-muted-foreground">
                After you place the order, you&apos;ll open Paymento&apos;s secure hosted page to send cryptocurrency.
              </p>

              <CheckoutPaymentReassurance method="CRYPTO" />
            </>
          )}
        </fieldset>

        <div className="space-y-3 rounded-2xl border border-border bg-card px-4 py-4 sm:px-5">
          <label className="flex cursor-pointer items-start gap-3 text-sm leading-6 text-muted-foreground">
            <input type="checkbox" name="confirmAge" required className="mt-1 h-4 w-4 shrink-0 accent-primary" />
            <span>I confirm I am 18 or older.</span>
          </label>
          <label className="flex cursor-pointer items-start gap-3 text-sm leading-6 text-muted-foreground">
            <input type="checkbox" name="acceptTerms" required className="mt-1 h-4 w-4 shrink-0 accent-primary" />
            <span>
              I agree to the{" "}
              <Link href="/terms-of-service" className="font-medium text-accent underline-offset-2 hover:underline" target="_blank">
                Terms of Service
              </Link>
              ,{" "}
              <Link href="/privacy-policy" className="font-medium text-accent underline-offset-2 hover:underline" target="_blank">
                Privacy Policy
              </Link>
              , and{" "}
              <Link href="/refund-policy" className="font-medium text-accent underline-offset-2 hover:underline" target="_blank">
                Return Policy
              </Link>
              .
            </span>
          </label>
        </div>

        <Button type="submit" size="lg" disabled={pending} className="h-14 w-full gap-2 text-base font-semibold">
          {pending ? (
            "Saving your order…"
          ) : (
            <>
              <Lock className="h-4 w-4" strokeWidth={2.5} aria-hidden />
              {submitButtonLabel(usingOnramp, usingManualCard)}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
