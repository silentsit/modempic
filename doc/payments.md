# Payments

Checkout accepts **card** (CardToUSDT) and **cryptocurrency** (Paymento).

| Method | Gateway | When |
|---|---|---|
| **Card** | CardToUSDT | Debit or credit card. Hosted page opens in a new tab. Settles as crypto to your payout wallet. |
| **Cryptocurrency** | Paymento | Shopper sends a supported asset on Paymento’s hosted page. |

Card routing is `isCardToUsdtConfigured()` in `web/src/lib/payments/cardtousdt/`. Crypto routing is `resolveCryptoCheckoutProviderForAsset()` in `web/src/lib/payments/crypto-provider.ts`.

---

## CardToUSDT

`submitCheckoutAction` creates the order, then the shopper lands on `/checkout/payment`. The checkout is minted there (`POST /api/checkout/payment-handoff`) so the form submit is not blocked on the gateway.

- Create: `POST https://api.cardtousdt.to/v2/checkout`
- Webhook: `GET`/`POST /api/webhooks/cardtousdt` (query string; do not redirect)
- Prisma method: `PaymentMethod.CARD_ONRAMP`, provider `"cardtousdt"`
- Store `amount_usd` from create and fulfil at ≥ 95% unless `CARDTOUSDT_FULFILL_BAND` is set

See `doc/cardtousdt.md`.

### Environment

- `CARDTOUSDT_PAYOUT_ADDRESS` (required for card checkout)
- Public HTTPS site origin, or `CARDTOUSDT_WEBHOOK_BASE_URL` for a tunnel
- Optional: `CARDTOUSDT_FULFILL_BAND`, `CARDTOUSDT_API_BASE`

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

CardToUSDT rejects localhost webhooks. For local card testing set `CARDTOUSDT_WEBHOOK_BASE_URL` to a public HTTPS tunnel.
