"use client";

import { useEffect, useActionState, useState } from "react";
import { submitCheckoutAction, type CheckoutState } from "@/lib/actions/checkout";
import { CHECKOUT_FORM_ID } from "./checkout-form-id";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { US_STATES } from "@/lib/checkout/us-states";
import { CryptoAsset } from "@prisma/client";
import { BtcpayModalCheckout } from "@/components/checkout/btcpay-modal-checkout";
import { Lock } from "lucide-react";

const inputCls =
  "mt-1.5 h-11 rounded-lg border-[var(--border)] bg-white shadow-sm dark:bg-[var(--background)]";

export function CheckoutForm({
  assets,
  userDisplayName,
  userEmail,
  btcpayEnabled,
  paymentoEnabled,
  btcpayUrl,
}: {
  assets: CryptoAsset[];
  userDisplayName: string;
  userEmail: string;
  btcpayEnabled: boolean;
  paymentoEnabled: boolean;
  btcpayUrl: string | null;
}) {
  const [state, action, pending] = useActionState(submitCheckoutAction, null as CheckoutState);
  const [shipDifferent, setShipDifferent] = useState(false);
  const defaultAsset = assets.includes(CryptoAsset.USDT)
    ? CryptoAsset.USDT
    : assets.includes(CryptoAsset.BTC)
      ? CryptoAsset.BTC
      : (assets[0] ?? CryptoAsset.USDT);
  const [selectedAsset, setSelectedAsset] = useState<CryptoAsset>(defaultAsset);
  const payWithBtcpay = selectedAsset === CryptoAsset.BTC && btcpayEnabled;
  const showAssetPicker = assets.length > 1 || paymentoEnabled;

  useEffect(() => {
    if (!state) return;
    if ("redirectTo" in state && typeof state.redirectTo === "string") {
      window.location.assign(state.redirectTo);
    }
  }, [state]);

  const btcpaySession = state && "btcpayCheckout" in state ? state.btcpayCheckout : null;

  if (btcpaySession) {
    return (
      <div className="space-y-6 rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
        <div>
          <h2 className="text-lg font-semibold text-[var(--foreground)]">Complete your payment</h2>
          <p className="mt-2 text-sm text-[var(--muted-foreground)]">
            Order <strong className="text-[var(--foreground)]">{btcpaySession.orderNumber}</strong> is ready. Pay with
            Bitcoin on-chain or Lightning — the payment window opens on this page.
          </p>
        </div>
        <BtcpayModalCheckout
          invoiceId={btcpaySession.invoiceId}
          checkoutLink={btcpaySession.checkoutLink}
          confirmationUrl={btcpaySession.confirmationUrl}
          btcpayUrl={btcpaySession.btcpayUrl}
          autoOpen
          buttonLabel="Pay with Bitcoin"
        />
      </div>
    );
  }

  return (
    <form id={CHECKOUT_FORM_ID} action={action} className="space-y-8">
      {state && "error" in state && state.error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900 dark:border-red-900 dark:bg-red-950/40 dark:text-red-100">
          {state.error}
        </p>
      ) : null}

      <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
        <p className="text-sm text-[var(--muted-foreground)]">
          Welcome back{" "}
          <span className="font-semibold text-[var(--foreground)]">{userDisplayName || "Customer"}</span>{" "}
          <span className="text-[var(--muted-foreground)]">({userEmail})</span>
        </p>
      </section>

      <fieldset className="space-y-4 rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
        <legend className="text-lg font-semibold text-[var(--foreground)]">Billing details</legend>
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
            className={`${inputCls} w-full px-3 text-sm`}
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
              className={`${inputCls} w-full px-3 text-sm`}
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
            className="mt-1 h-4 w-4 rounded border-[var(--border)]"
          />
          <Label htmlFor="shipDifferent" className="font-normal leading-snug">
            Ship to a different address?
          </Label>
        </div>

        {shipDifferent ? (
          <div className="space-y-4 border-t border-[var(--border)] pt-6">
            <p className="text-sm font-semibold text-[var(--foreground)]">Shipping address</p>
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
              <select id="shipCountry" name="shipCountry" className={`${inputCls} w-full px-3 text-sm`} defaultValue="US">
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
                  className={`${inputCls} w-full px-3 text-sm`}
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

      <fieldset className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
        <legend className="text-lg font-semibold text-[var(--foreground)]">Additional information</legend>
        <div className="mt-4">
          <Label htmlFor="orderNotes">Notes about your order (optional)</Label>
          <Textarea
            id="orderNotes"
            name="orderNotes"
            rows={4}
            className="mt-1.5 rounded-lg border-[var(--border)] bg-white shadow-sm dark:bg-[var(--background)]"
            placeholder="Delivery instructions, scheduling, or other notes."
          />
        </div>
      </fieldset>

      <fieldset className="space-y-5 rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
        <legend className="text-lg font-semibold text-[var(--foreground)]">Payment</legend>

        <div className="space-y-4">
          <input type="hidden" name="paymentMethod" value="CRYPTO" />
          <div className="flex items-start gap-3 rounded-lg border border-[var(--primary)] bg-[var(--muted)]/40 p-4">
            <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-[var(--primary)] bg-[var(--primary)]">
              <span className="h-2 w-2 rounded-full bg-[var(--primary-foreground)]" />
            </span>
            <span className="flex-1">
              <span className="flex items-center gap-2 font-medium text-[var(--foreground)]">
                <span className="text-lg" aria-hidden>
                  ₿
                </span>
                Pay with cryptocurrency
              </span>
              <span className="mt-1 block text-sm text-[var(--muted-foreground)]">
                {payWithBtcpay
                  ? "Bitcoin on-chain or Lightning via BTCPay — funds go directly to our wallet."
                  : paymentoEnabled
                    ? "Pay with your selected asset via our secure crypto gateway."
                    : "Select your preferred asset and complete your payment securely."}
              </span>
            </span>
          </div>

          {showAssetPicker ? (
            <div>
              <Label htmlFor="asset">Preferred crypto asset</Label>
              <select
                id="asset"
                name="asset"
                className={`${inputCls} mt-1.5 w-full px-3 text-sm`}
                value={selectedAsset}
                onChange={(e) => setSelectedAsset(e.target.value as CryptoAsset)}
              >
                {assets.map((a) => (
                  <option key={a} value={a}>
                    {a}
                    {a === CryptoAsset.BTC && btcpayEnabled ? " (BTCPay)" : ""}
                    {a !== CryptoAsset.BTC && paymentoEnabled ? " (Paymento)" : ""}
                  </option>
                ))}
              </select>
              {!payWithBtcpay ? (
                <div className="mt-5 flex flex-col gap-3 text-sm text-[var(--muted-foreground)] sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                  <div className="min-w-0 flex-1 space-y-1">
                    <p>Need {selectedAsset}? Buy it with your card in about 3 minutes — no KYC required.</p>
                    <p className="text-xs leading-snug text-[var(--muted-foreground)]">
                      Keep this page open, then return here to complete checkout.
                    </p>
                  </div>
                  <a
                    href="https://guardarian.com/buy-crypto-without-verification"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex w-full items-center justify-center rounded-md border border-[#2f7d5c] bg-[#ecfdf5] px-3 py-1.5 text-sm font-semibold text-[#14532d] transition-colors hover:border-[#166534] hover:bg-[#d1fae5] sm:w-fit"
                  >
                    Buy {selectedAsset} with card
                  </a>
                </div>
              ) : null}
            </div>
          ) : (
            <input type="hidden" name="asset" value={CryptoAsset.BTC} />
          )}

          {payWithBtcpay && btcpayUrl ? (
            <p className="text-xs text-[var(--muted-foreground)]">
              Lightning payments confirm instantly. On-chain Bitcoin typically confirms within one block (~10 minutes).
            </p>
          ) : null}
        </div>
      </fieldset>

      <Button
        type="submit"
        size="lg"
        disabled={pending}
        className="h-14 w-full gap-2 bg-[#2f3d4a] text-base font-semibold text-white hover:bg-[#263340] dark:bg-[#1e293b] dark:hover:bg-[#0f172a]"
      >
        {pending ? (
          "Placing order…"
        ) : (
          <>
            <Lock className="h-4 w-4" strokeWidth={2.5} aria-hidden />
            {payWithBtcpay ? "Place order & pay with Bitcoin" : "Pay with Crypto"}
          </>
        )}
      </Button>
    </form>
  );
}
