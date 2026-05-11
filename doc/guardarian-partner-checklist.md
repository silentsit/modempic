# Guardarian partner onboarding — questions for sales / account manager

Use this list when you email Guardarian (or on a discovery call). Adapt wording to whether you pursue **On-ramp**, **Checkout / G-Payments**, or both.

## Product scope

- Which products are enabled on our account if we select **only On-ramp** vs adding **Checkout**? Can Checkout be enabled later without a new contract?
- For **Modempic** (e‑commerce): recommended path for **order-linked** payments — widget URL only, API-created sessions, or **G-Payments / invoicing**?

## Pricing & settlement (fiat + crypto)

- **End-customer pricing:** How is the rate built (spread, fixed fee, payment-method surcharge)? Is everything **included in the calculator quote** with **no extra charges** at the last step?
- **Merchant side:** Any **per-transaction fee**, **monthly minimum**, **FX markup**, or **settlement fee** to our **bank** or **wallet**?
- **Settlement:** What options exist for **fiat payout** (currency, timing, fees)? What options for **crypto payout** (supported assets, networks)?
- **Checkout / G-Payments specifically:** After the buyer pays in **fiat**, what is the exact **settlement path** (fiat to our bank vs converted to crypto vs configurable)?

## Technical integration

- **Widget:** Confirm base URL pattern (`calculator/v1`), required params (`partner_api_token`), and recommended **`redirects_successful` / `_failed` / `_cancelled`** for returning users to our site with order context.
- **Linking orders:** What field should we pass through so **webhooks** reconciliate to our **`orderNumber` / order id** (`external_partner_link_id` or equivalent)?
- **Webhooks:** Confirm availability, **IP allowlist**, signing/verification, and event types we need (`finished`, `failed`, `cancelled`, etc.). Optional: **KYC/deposit** webhooks — when are they needed?

## Compliance & UX copy

- Under what conditions does **KYC** or extra verification run? (So storefront copy stays accurate.)
- Refund / chargeback posture for **card** vs **bank** rails — what do **we** vs **Guardarian** handle?

## Operations

- Sandbox / test mode for integration before production keys?
- Dedicated **support SLAs** and escalation for failed payments or stuck settlements?

---

## On-ramp only: who receives the crypto?

**Default expectation:** In a typical **consumer on-ramp**, the buyer specifies a **recipient wallet** — crypto usually goes to **that address** (often the **customer’s** wallet), not automatically to the merchant.

**If you need crypto to land with Modempic:**

- Ask Guardarian explicitly whether they support **merchant treasury / payout address** as the **default or only** recipient for your integration (some B2B setups allow this; it is **not** the same as default retail widget behavior).
- Otherwise the flow is usually: **customer buys crypto → customer pays your checkout** (two steps), or you use **Checkout / settlement** so **you** receive **fiat or crypto** per your merchant agreement — clarify which product matches your checkout model.

Record their answer in writing before promising customers how funds flow.
