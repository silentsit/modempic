# AGENTS.md

## Cursor Cloud specific instructions

This repo is a single Next.js App Router ecommerce app (`Modempic`). The runnable app lives in `web/`; the repo root only proxies scripts into `web/` (see root `package.json`). Standard commands are documented in `README.md`, `web/README.md`, and `web/package.json` scripts — prefer those instead of duplicating them.

### Services

- **Web app (Next.js)** — the only long-running service. Run `npm run dev` from the repo root (or `cd web && npm run dev`). Serves on `http://localhost:3000`.
- **PostgreSQL 16** — required backing store for Prisma. It is installed in the VM image as a native apt package (not Docker), so ignore `compose.yml` on Cursor Cloud.

### Startup (not handled by the update script)

The update script only refreshes Node dependencies. Before running the app, tests, migrations, or seeds, start Postgres and (if missing) create the local DB:

```bash
sudo pg_ctlcluster 16 main start   # start Postgres; safe to re-run if already started
# One-time only (data persists in the snapshot). Skip if the modempic role/db already exist:
sudo -u postgres psql -c "CREATE USER modempic WITH PASSWORD 'modempiclocal' CREATEDB;"
sudo -u postgres psql -c "CREATE DATABASE modempic OWNER modempic;"
```

### Environment variables

The app reads `web/.env.local` (loaded via `dotenv-cli` in the db/build scripts). It is gitignored and already present on disk in the snapshot. If it is ever missing, recreate it from `web/.env.example` with at minimum:

```
DATABASE_URL="postgresql://modempic:modempiclocal@127.0.0.1:5432/modempic"
DIRECT_URL="postgresql://modempic:modempiclocal@127.0.0.1:5432/modempic"
AUTH_SECRET="local-dev-auth-secret-local-dev-auth-secret"
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
AUTH_URL="http://localhost:3000"
DEV_PAYMENT_SIMULATE="1"
CRYPTO_WEBHOOK_SECRET="local-dev-crypto-webhook-secret"
SEED_ADMIN_PASSWORD="ModempicDev2025!"
SEED_CUSTOMER_PASSWORD="CustomerDev2025!"
```

`DEV_PAYMENT_SIMULATE="1"` makes crypto checkout use a simulated (no real gateway) payment, so orders can be placed end to end without BTCPay/Paymento keys.

### Database migrations and seed

After Postgres is up, apply schema and seed demo data (run from repo root):

```bash
npm run db:migrate:deploy   # apply Prisma migrations
npm run db:seed             # creates admin/staff/customer users + "E2E Checkout Product"
```

Seeded logins for manual testing (local dev only): `info@modempic.com` / `ModempicDev2025!` (admin), `customer@modempic.com` / `CustomerDev2025!` (customer). The storefront uses a **"Buy now"** direct-to-checkout flow and **requires sign-in before checkout** (no guest checkout).

### Verify / lint / test / build

Standard commands (from repo root, all delegate to `web/`): `npm run db:validate`, `npm run lint`, `npm run test` (Vitest), `npm run build`. `npm run build` runs `prisma migrate deploy` before `next build`, so Postgres must be running. `npm run test:e2e` (Playwright) needs the seeded DB and a Chromium browser (`npx --prefix web playwright install chromium`).

### Gotchas

- Do not run `npm run build` while `npm run dev` is running — both write to `web/.next` and the production build can break the running dev server. If dev misbehaves after a build, stop it, `rm -rf web/.next`, and re-run `npm run dev` (see `doc/local-dev.md`).
- Use the default webpack dev command (`npm run dev`), not `dev:turbo`.
