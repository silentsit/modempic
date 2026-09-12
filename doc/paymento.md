# Paymento (crypto checkout)

1. Create a merchant account and generate an **API key** and **secret key** in the [Paymento dashboard](https://app.paymento.io).
2. Set environment variables in your deployment (see `src/lib/env.ts`):
   - `PAYMENTO_API_KEY`
   - `PAYMENTO_SECRET_KEY` (server-only; HMAC of raw IPN body vs. `X-Hmac-Sha256-Signature` / `HMAC_SHA256_SIGNATURE` per [callback docs](https://docs.paymento.io/api-documention/payment-callback.md))
   - Optional: `PAYMENTO_SPEED` — ignored for checkout. Requests always use confirmation speed (`RiskSpeed` 1) so an order is not marked paid on mempool.
   - Optional: `PAYMENTO_API_BASE` / `PAYMENTO_GATEWAY_BASE` if Paymento provides different URLs
3. Configure the **IPN (Instant Payment Notification) URL** in the Paymento dashboard to your public HTTPS endpoint:
   - `https://<your-domain>/api/webhooks/paymento`
4. Set `AUTH_URL` or `NEXT_PUBLIC_SITE_URL` to your public site origin so return URLs and Paymento `ReturnUrl` are correct.

Fulfilment and the customer order confirmation email wait until the crypto transaction is fully complete: IPN status **7 (Paid)** or **8 (Approve)**, plus verify showing Paid/Approve. Status **3 (WaitingToConfirm)** is ignored. `success: false` on verify is normal for Paid and is not treated as failure. See `src/lib/payments/paymento/`.

Do not use customer redirects alone for fulfilment; rely on the IPN as described in [Paymento’s documentation](https://docs.paymento.io).
