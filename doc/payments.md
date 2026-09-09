# Payments: Paymento (cryptocurrency)

Checkout is **cryptocurrency-only** through Paymento.

| Method | Gateway | When |
|---|---|---|
| **Cryptocurrency** | Paymento | All checkout orders |

Implementation: checkout form uses `paymentMethod: "CRYPTO"` (`web/src/lib/checkout/checkout-form.ts` and `web/src/app/(site)/checkout/ui.tsx`). Crypto routing is `resolveCryptoCheckoutProviderForAsset()` in `web/src/lib/payments/crypto-provider.ts`.

---

## Paymento

`submitCheckoutAction` creates the order, then the shopper lands on `/checkout/payment`. Paymento is minted there (`POST /api/checkout/payment-handoff`) so the form submit is not blocked on the gateway.

- Webhook: `POST /api/webhooks/paymento`
- HMAC verification via `PAYMENTO_SECRET_KEY`
- Prisma method: `PaymentMethod.CRYPTO`, provider `"paymento"`

### Environment

- `PAYMENTO_API_KEY`, `PAYMENTO_SECRET_KEY`, `PAYMENTO_SPEED`
- Optional: `CRYPTO_PROVIDER=paymento` to force Paymento when debugging
- **IPN URL:** `https://yourdomain.com/api/webhooks/paymento`

See also `doc/paymento.md`.

---

## Development

Without Paymento keys, crypto checkout uses the built-in **simulator** when `NODE_ENV=development` or `DEV_PAYMENT_SIMULATE=1`.
