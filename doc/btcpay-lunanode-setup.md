# BTCPay on LunaNode (Modempic)

Use this when deploying **General Purpose `s.4`** ($14/mo) for **Bitcoin + Lightning only**. USDT and other assets stay on **Paymento** (Vercel env vars).

---

## 1. LunaNode

1. Sign up at [lunanode.com](https://www.lunanode.com).
2. Add account credit.
3. Create an API key (Account → API) if using the web launcher.
4. Deploy via **[BTCPay web launcher](https://launch.lunanode.com/)** (or LunaNode panel → create VM with BTCPay template).
5. Choose **General Purpose `s.4`**: 4 GB RAM, 6 vCPU, 70 GB SSD.
6. Pick a region close to you (e.g. Toronto if available).
7. Wait for the VM; note the **public IP** or hostname.

**Initial sync:** Bitcoin can take **several days**. The site may be up before you can accept payments — normal.

---

## 2. First login to BTCPay

1. Open `https://YOUR-SERVER-IP` (or the URL LunaNode gives you).
2. Register the **admin account** (use a strong password + save in a password manager).
3. Create a **store** (e.g. Modempic).
4. Store → **Settings → General** → copy **Store ID** (needed for `BTCPAY_STORE_ID`).

---

## 3. Cost-efficient node settings

In your BTCPay Docker / LunaNode env (or `docker-compose` / `.env` on the server — see [BTCPay deployment docs](https://docs.btcpayserver.org/Docker/)):

- Enable **pruned** Bitcoin (target **under 10 GB** chain data, not full archival).
- Do **not** enable extra altcoin daemons (LTC, XMR, etc.).
- Enable **Lightning** (LND or Core Lightning) for fast checkout.

After wallet setup:

- Store → **Wallets** → connect Bitcoin wallet (hardware wallet via [Vault](https://docs.btcpayserver.org/Vault/) recommended for production).
- Store → **Lightning** → set up / connect LN.

---

## 4. Domain (recommended)

Point a subdomain to the server, e.g. `pay.modempic.com`:

1. DNS **A record** → LunaNode IP.
2. Optional: **Cloudflare** proxy for DDoS — **disable caching** on API paths; do not cache webhook or `/api/v1` routes.
3. Enable **HTTPS** on BTCPay (Let’s Encrypt in BTCPay or Cloudflare SSL).

Use this URL everywhere below as `BTCPAY_URL` — **server root only** (e.g. `https://pay.modempic.com`), not a store page or `/stores/...` path. Modempic calls `https://<BTCPAY_URL>/api/v1/stores/<BTCPAY_STORE_ID>/invoices`.

---

## 5. API key

Account → **Manage account** → **API keys** → Create:

- **Store:** Modempic only (not all stores).
- **Permissions:** view/create/modify invoices, modify store webhooks, view store settings.

Save the key as `BTCPAY_API_KEY`.

---

## 6. Webhook (Modempic on Vercel)

Store → **Settings** → **Webhooks** → Create:

| Field | Value |
|-------|--------|
| URL | `https://YOUR-MODEMPIC-DOMAIN.com/api/webhooks/btcpay` |
| Events | `InvoiceProcessing`, `InvoiceSettled`, `InvoiceExpired`, `InvoiceInvalid` |

Copy the **webhook secret** → `BTCPAY_WEBHOOK_SECRET`.

---

## 7. Vercel environment variables

Project → Settings → Environment Variables → **Production** (and Preview if you test there):

```bash
BTCPAY_URL=https://pay.modempic.com
BTCPAY_API_KEY=...
BTCPAY_STORE_ID=...
BTCPAY_WEBHOOK_SECRET=...
NEXT_PUBLIC_SITE_URL=https://modempic.com
NEXT_PUBLIC_BTCPAY_URL=https://pay.modempic.com
```

Optional: `CRYPTO_PROVIDER=btcpay` to force BTCPay when Paymento is also configured.

For **USDT / USDC / BNB**, keep Paymento vars set separately (`PAYMENTO_API_KEY`, `PAYMENTO_SECRET_KEY`).

**Redeploy** Modempic after saving env vars.

---

## 8. Test

1. Place a small test order on Modempic (signed in).
2. BTCPay **modal** should open on checkout.
3. Pay with **Lightning** (fastest) or a small on-chain amount.
4. Order should move to **processing**, then **completed**; confirmation email on settle.
5. If webhook fails: BTCPay invoice → **Redeliver** webhook; check Vercel function logs.

---

## 9. If the server runs out of memory

During **first sync** only: resize VM to **`s.8`** ($28/mo), then resize back to **`s.4`** after sync completes.

---

## Quick reference

| Item | Where |
|------|--------|
| Modempic code | Vercel |
| BTCPay | LunaNode `s.4` |
| BTC + Lightning | BTCPay |
| USDT, USDC, BNB, … | Paymento |
| Webhook | `POST /api/webhooks/btcpay` on Modempic |

See also `doc/payments.md`.
