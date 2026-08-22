# Payments: PeptidePay (card, default) and Paymento (crypto)

Checkout defaults to **card**. Cryptocurrency is an optional second method.

| Method | Gateway | When |
|---|---|---|
| **Card / Apple Pay / Google Pay** | PeptidePay (Qist) | Default whenever `PEPTIDEPAY_API_KEY` is set |
| **Cryptocurrency** | Paymento | Optional radio; BTC, USDT, and other accepted assets |

Implementation: checkout form defaults to `CARD_ONRAMP` (`web/src/lib/checkout/checkout-form.ts` and `web/src/app/(site)/checkout/ui.tsx`). Crypto routing is `resolveCryptoCheckoutProviderForAsset()` in `web/src/lib/payments/crypto-provider.ts`.

---

## PeptidePay (default card checkout)

Hosted card, Apple Pay, and Google Pay. Server Action `submitCheckoutAction` creates a PeptidePay session and redirects the customer to the hosted checkout.

- Webhook: `POST /api/webhooks/peptidepay` (alias `POST /api/qist-webhook`)
- HMAC header: `x-peptidepay-signature`
- Prisma method: `PaymentMethod.CARD_ONRAMP`, provider `"peptidepay"`

### Environment

| Variable | Purpose |
|---|---|
| `PEPTIDEPAY_API_KEY` | Secret API key (`sk_live_…` in production, `sk_test_…` locally) |
| `PEPTIDEPAY_WEBHOOK_SECRET` | Webhook signing secret (`whsec_…`; also accepts `QIST_WEBHOOK_SECRET`) |
| `PEPTIDEPAY_API_BASE` | Optional API host (default `https://pay.qistdigital.com`) |

**Webhook URL:** `https://yourdomain.com/api/webhooks/peptidepay`

See also `doc/guardarian-partner-checklist.md` for card-on-ramp operational notes.

---

## Paymento (optional crypto)

Customers who choose crypto pay on Paymento hosted checkout. IPN hits `POST /api/webhooks/paymento` with HMAC verification (`PAYMENTO_SECRET_KEY`).

See also `doc/paymento.md`.

### Environment

- `PAYMENTO_API_KEY`, `PAYMENTO_SECRET_KEY`, `PAYMENTO_SPEED`
- Optional: `CRYPTO_PROVIDER=paymento` to force Paymento when debugging
- **IPN URL:** `https://yourdomain.com/api/webhooks/paymento`

---

## Development

Without Paymento keys, crypto checkout uses the built-in **simulator** when `NODE_ENV=development` or `DEV_PAYMENT_SIMULATE=1`. Card checkout still requires PeptidePay keys.
