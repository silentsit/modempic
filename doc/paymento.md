# Paymento (crypto checkout)

1. Create a merchant account and generate an **API key** and **secret key** in the [Paymento dashboard](https://app.paymento.io).
2. Set environment variables in your deployment (see `src/lib/env.ts`):
   - `PAYMENTO_API_KEY`
   - `PAYMENTO_SECRET_KEY` (server-only, used to verify `X-HMAC-SHA256-SIGNATURE` on IPN)
   - Optional: `PAYMENTO_SPEED` — `0` (faster, mempool) or `1` (block confirmations, default if unset)
   - Optional: `PAYMENTO_API_BASE` / `PAYMENTO_GATEWAY_BASE` if Paymento provides different URLs
3. Configure the **IPN (Instant Payment Notification) URL** in the Paymento dashboard to your public HTTPS endpoint:
   - `https://<your-domain>/api/webhooks/paymento`
4. Set `AUTH_URL` or `NEXT_PUBLIC_SITE_URL` to your public site origin so return URLs and Paymento `ReturnUrl` are correct.

Fulfilment: on IPN with status **7 (Paid)**, the app verifies HMAC, calls Paymento’s `POST /v1/payment/verify` with the token, then marks the order paid. See `src/lib/payments/paymento/`.

Do not use customer redirects alone for fulfilment; rely on the IPN as described in [Paymento’s documentation](https://docs.paymento.io).
