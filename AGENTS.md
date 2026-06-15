# AGENTS.md

## Cursor Cloud specific instructions

This repo is the **Modempic** Next.js App Router ecommerce app. The runnable application lives in `web/`; the repository root only proxies common scripts into that app (see root `package.json` and `README.md`). Standard commands are documented in `README.md`, `web/README.md`, and `web/package.json` scripts — reference those rather than memorizing.

### Services

- **Next.js dev server** (`web/`): the only application service. Run `npm run dev` from the repo root (or from `web/`). Serves the storefront, admin, API routes, and payment webhooks on `http://localhost:3000`.
- **PostgreSQL 16**: required backing store for the app, Prisma, tests, and the build (`npm run build` runs `prisma migrate deploy` first). It is installed as a system package in the VM image (snapshot), not by the update script.

### Startup caveats (non-obvious)

- **Start PostgreSQL before doing anything DB-related.** It does not auto-start in a fresh VM. Run `sudo pg_ctlcluster 16 main start` (or `sudo service postgresql start`). Verify with `pg_isready`. The local role/db are `modempic`/`modempic` (password `modempiclocal`), matching `compose.yml`.
- **Env vars live in `web/.env.local`** (gitignored). It is loaded automatically by `next dev` and by the `dotenv -e .env -e .env.local` wrappers in `web/package.json`. If it is missing on a fresh machine, recreate it with `DATABASE_URL`/`DIRECT_URL` pointing at `postgresql://modempic:modempiclocal@127.0.0.1:5432/modempic`, plus `AUTH_SECRET`, `NEXT_PUBLIC_SITE_URL=http://localhost:3000`, `AUTH_URL=http://localhost:3000`, `DEV_PAYMENT_SIMULATE=1`, `CRYPTO_WEBHOOK_SECRET`, and the seed passwords. The CI workflow `.github/workflows/ci.yml` shows the same minimal set.
- **First-time DB setup:** `npm run db:migrate:deploy` then `npm run db:seed`. Seeding creates demo users (`info@modempic.com` admin, `customer@modempic.com` customer — passwords from `SEED_ADMIN_PASSWORD`/`SEED_CUSTOMER_PASSWORD`) and an `e2e-checkout-product`.
- **Payments run in simulation locally.** With `DEV_PAYMENT_SIMULATE=1`, crypto checkout produces a fake invoice and exposes a "mark crypto payment as received" button on the order confirmation page — no real gateway credentials (BTCPay/Paymento/Guardarian) are needed for local checkout testing. Third-party keys (Resend, Google OAuth, Cloudinary, OpenAI chat) are optional and only needed for those specific features.

### Lint / test / build / e2e

- Lint: `npm run lint`; Unit tests: `npm run test` (vitest, no DB needed); Build: `npm run build` (requires a reachable DB because it runs `prisma migrate deploy`).
- E2E: `npm run test:e2e` (Playwright). The Playwright config starts its own `npm run dev` server and only needs Chromium installed (`npx playwright install --with-deps chromium`).
- Avoid Turbopack (`npm run dev:turbo`) for routine dev; the default webpack `npm run dev` is the supported path (see `doc/local-dev.md`).
