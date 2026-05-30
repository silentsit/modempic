# Payments: BTCPay, Paymento (crypto in), card on-ramp (Guardarian-style)

## Crypto provider selection

When the customer chooses **crypto** at checkout, the app picks a gateway in this order (unless `CRYPTO_PROVIDER` overrides):

1. **BTCPay Server** — if `BTCPAY_URL`, `BTCPAY_API_KEY`, and `BTCPAY_STORE_ID` are set
2. **Paymento** — if `PAYMENTO_API_KEY` and `PAYMENTO_SECRET_KEY` are set
3. **Built-in simulator** — development only (`NODE_ENV=development` or `DEV_PAYMENT_SIMULATE=1`)

Set `CRYPTO_PROVIDER=paymento` or `CRYPTO_PROVIDER=btcpay` to force one gateway.

### Multi-crypto plan (BTC + USDT and others)

Modempic routes checkout **by asset**:

| Asset | Gateway |
|---|---|
| **BTC** | BTCPay (if configured) |
| **USDT, USDC, BNB, etc.** | Paymento (if configured) |

Configure **both** on Vercel for the full mix. Do not add altcoin daemons on the BTCPay VPS — keep LunaNode Bitcoin + Lightning only.

---

## BTCPay Server (recommended for Bitcoin / Lightning)

Non-custodial Bitcoin and Lightning checkout via the [Greenfield API](https://docs.btcpayserver.org/Development/ecommerce-integration-guide/).

- Checkout creates a BTCPay invoice; the customer pays in a **modal overlay** on Modempic (or via backup link).
- Webhooks update order status: `InvoiceProcessing` → processing, `InvoiceSettled` → completed.
- Funds go **directly to your wallet** on your BTCPay instance — no middleman fees.

### Environment

Set in Vercel/hosting (see `src/lib/env.ts`):

| Variable | Purpose |
|---|---|
| `BTCPAY_URL` | Your BTCPay instance URL (e.g. `https://pay.yourdomain.com`) |
| `BTCPAY_API_KEY` | Store-scoped API key with invoice + webhook permissions |
| `BTCPAY_STORE_ID` | Store ID from BTCPay |
| `BTCPAY_WEBHOOK_SECRET` | Webhook signing secret from BTCPay store settings |
| `NEXT_PUBLIC_BTCPAY_URL` | Optional; public URL for `btcpay.js` modal (defaults to `BTCPAY_URL`) |
| `CRYPTO_PROVIDER` | Optional; `btcpay` or `paymento` |

**Webhook URL to register in BTCPay:**  
Store → Settings → Webhooks → `https://yourdomain.com/api/webhooks/btcpay`

Subscribe at minimum to: `InvoiceProcessing`, `InvoiceSettled`, `InvoiceExpired`, `InvoiceInvalid`.

### API key permissions

- View / create / modify invoices  
- Modify store webhooks  
- View store settings  

### Hosting

Deploy your own instance (LunaNode, Voltage, VPS) or use a managed BTCPay host. Enable **Lightning** for instant checkout UX.

---

## Paymento (multi-asset crypto)

Customers pay in cryptocurrency via Paymento hosted checkout. IPN hits `POST /api/webhooks/paymento` with HMAC verification (`PAYMENTO_SECRET_KEY`).

See also `doc/paymento.md`.

### Environment

- `PAYMENTO_API_KEY`, `PAYMENTO_SECRET_KEY`, `PAYMENTO_SPEED`  
- **IPN URL:** `https://yourdomain.com/api/webhooks/paymento`

---

## Guardarian-style on-ramp

When the customer chooses **card**, we create a card on-ramp session (`src/lib/payments/guardarian-adapter.ts`). This is separate from crypto checkout.

---

## Development

Without BTCPay or Paymento keys, crypto checkout uses the built-in **simulator** when `NODE_ENV=development` or `DEV_PAYMENT_SIMULATE=1`.
