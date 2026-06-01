# Payments: BTCPay, Paymento (crypto in), card on-ramp (Guardarian-style)

## Crypto provider selection (per-asset routing)

When the customer chooses **crypto** at checkout, the app routes by **selected asset**:

| Asset | Gateway |
|---|---|
| **BTC** (Bitcoin / Lightning) | BTCPay Server |
| **USDT, USDC, ETH, and all other accepted assets** | Paymento |

Implementation: `resolveCryptoCheckoutProviderForAsset()` in `web/src/lib/payments/crypto-provider.ts`. The checkout dropdown only lists assets whose gateway is configured.

**Production:** configure **both** BTCPay and Paymento env sets and **remove `CRYPTO_PROVIDER`** from Vercel so split routing is active.

**Debug only:** set `CRYPTO_PROVIDER=paymento` or `CRYPTO_PROVIDER=btcpay` to force every asset through one gateway (not recommended for live checkout).

If no gateway is configured, development can use the built-in **simulator** (`NODE_ENV=development` or `DEV_PAYMENT_SIMULATE=1`).

### Why split gateways?

Modempic accepts **more than Bitcoin** (USDT, USDC, BNB, etc.):

| Asset class | Gateway | Why |
|---|---|---|
| **BTC, Lightning** | BTCPay | Non-custodial, no gateway fees, fast LN checkout |
| **USDT, USDC, BNB, etc.** | Paymento | Broad stablecoin/alt support without running extra coin daemons on BTCPay |

**Do not** enable many altcoin daemons on the BTCPay VPS (LTC, XMR, …) just for USDT — that increases RAM and cost. BTCPay can take USDT via **plugins** (e.g. Tron, Liquid) if you later want stablecoins on the same instance; until then, route stablecoins through Paymento.

**Checkout behavior:** customer picks asset → **BTC** opens the BTCPay modal on Modempic, **USDT/other** redirects to Paymento hosted checkout.

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
| `CRYPTO_PROVIDER` | **Debug only** — `btcpay` or `paymento` forces all assets to one gateway; **omit in production** for per-asset split routing |

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
