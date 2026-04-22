# Payments: Paymento (crypto in) vs card on-ramp (Guardarian-style)

## Roles

- **Paymento** — Customers pay your store **in cryptocurrency**. The app creates a Paymento payment request and redirects to their hosted checkout. Funds go to the wallet you configure in the [Paymento](https://paymento.io) merchant dashboard. IPN hits `POST /api/webhooks/paymento` with HMAC verification (`PAYMENTO_SECRET_KEY`).

- **Guardarian-style on-ramp** — When the customer chooses **card**, we create a **card on-ramp session** (adapter in `src/lib/payments/guardarian-adapter.ts`). The customer may use a partner flow to buy crypto or pay with card per that partner’s compliance—this is **not** the same as Paymento receiving funds; it is an alternate path at checkout.

## Environment (Paymento)

Set in Vercel/hosting (see `src/lib/env.ts`):

- `PAYMENTO_API_KEY` — from Paymento dashboard  
- `PAYMENTO_SECRET_KEY` — for IPN HMAC verification  
- `PAYMENTO_SPEED` — `0` or `1` (see Paymento docs)  
- `NEXT_PUBLIC_SITE_URL` — used for `ReturnUrl` (e.g. `https://yourdomain.com`)

**IPN URL to register in Paymento:**  
`https://yourdomain.com/api/webhooks/paymento`

## Development

Without Paymento keys, **crypto** checkout uses the built-in **simulator** only when `NODE_ENV=development` or `DEV_PAYMENT_SIMULATE=1`. Production requires Paymento (or you will see a configuration error).
