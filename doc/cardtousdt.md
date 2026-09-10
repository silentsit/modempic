# CardToUSDT (card checkout)

Card checkout uses [CardToUSDT](https://cardtousdt.to/docs/). There is no API key. Each `POST` creates a hosted checkout that settles to the `payout_address` you send.

Unwhitelisted calls work the same as production and carry a 25% fee. Telegram is only for a production rate.

## Flow

1. `submitCheckoutAction` creates the order with `PaymentMethod.CARD_ONRAMP` and provider `cardtousdt`.
2. The shopper lands on `/checkout/payment`. The app mints `POST https://api.cardtousdt.to/v2/checkout` and stores `amount_usd`.
3. The shopper opens `checkout_url` in a **new tab**. Do not embed it or rewrite it.
4. CardToUSDT calls `GET` (then `POST` if they get `405`) on `/api/webhooks/cardtousdt?order_id=…&secret=…` and appends `txid_out`, `value_coin`, `coin`, `c2t_ts`, `c2t_sig`.
5. We verify, compare settlement to stored `amount_usd` at or above 80%, then mark the order paid.

They never add `order_id` to the webhook. We put it on the URL ourselves.

## Environment

Set these in Vercel / `.env.local`:

- `CARDTOUSDT_PAYOUT_ADDRESS` — your self-custodial `0x` + 40 hex payout wallet. Money settles here.
- Public HTTPS origin — `AUTH_URL` or `NEXT_PUBLIC_SITE_URL` on production. Localhost is rejected.
- `CARDTOUSDT_WEBHOOK_BASE_URL` — optional tunnel origin for local webhook testing.
- `CARDTOUSDT_FULFILL_BAND` — optional, default `0.80`. Lower only if unwhitelisted settlements arrive net of their fee.
- `CARDTOUSDT_API_BASE` — optional API host override.

Webhook URL the API receives:

`https://<your-domain>/api/webhooks/cardtousdt?order_id=<orderNumber>&secret=<hmac>`

Do not redirect that route. A dropped query loses `txid_out` / `value_coin` / `coin`.

## Fulfilment rules

1. Store `amount_usd` from create. Compare the webhook to that figure, not an amount parsed from `checkout_url`.
2. Fulfil at or above 80% of stored `amount_usd` unless you set a tighter band.
3. USD stables (`polygon_usdc`, `erc20_usdc`, `erc20_usdt`, `erc20_pyusd`): `value_coin` is already USD. Native coins: `GET https://api.cardtousdt.to/crypto/{coin-with-_-as-/}/info.php` and multiply by `prices.USD`. If that quote is missing, hold.
4. Dedupe on `txid_out`. Return `200` on first fulfilment, replay, and hold. Return `4xx` only for a missing or bad signature.

If create returns `webhook_secret`, we store it and verify `c2t_sig`. If it is omitted, we check our own `secret` query param.

## Production rate

Message [CardToUSDT on Telegram](https://t.me/Card_to_usdt) for a whitelisted rate. Until then, unwhitelisted checkouts still work.
