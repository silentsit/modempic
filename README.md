# Modempic

Modempic is a custom Next.js ecommerce app for catalog, cart, checkout, admin, email, reviews, social proof, and crypto payment flows. The runnable application lives in `web/`; the repository root only proxies common scripts into that app.

## Project Layout

- `web/` - Next.js App Router application, Prisma schema/migrations, scripts, tests, and runtime code.
- `doc/` - operational documentation and stable reference material.
- `compose.yml` - optional local PostgreSQL 16 service for development.
- `Noofox-Images/` and legacy export folders - local migration inputs only; keep them out of git.

## Local Setup

1. Install dependencies:

   ```powershell
   npm --prefix web install
   ```

2. Copy and fill environment variables:

   ```powershell
   Copy-Item web\.env.example web\.env.local
   ```

3. Start local PostgreSQL if needed:

   ```powershell
   docker compose up -d
   ```

4. Run Prisma and start the app:

   ```powershell
   npm run db:migrate:deploy
   npm run dev
   ```

Open `http://localhost:3000`.

## Common Commands

Run these from the repository root:

```powershell
npm run dev
npm run build
npm run lint
npm run test
npm run db:validate
npm run db:studio
```

The root scripts delegate to `web/package.json`.

## Deployment

Vercel must use `web` as the project Root Directory. See `doc/vercel-deployment.md` before changing deployment settings.

Production builds run Prisma migrations before `next build`, so `DATABASE_URL` must be available to the build environment.

## Useful Docs

- `doc/local-dev.md` - local development troubleshooting.
- `doc/vercel-deployment.md` - Vercel root directory and deployment notes.
- `doc/payments.md` - BTCPay, Paymento, and card on-ramp behavior.
- `doc/btcpay-lunanode-setup.md` - BTCPay hosting notes.
- `doc/paymento.md` - Paymento integration notes.
- `doc/guardarian-partner-checklist.md` - card on-ramp checklist.

## Data Hygiene

Do not commit customer exports, order exports, image dumps, payment secrets, `.env*` files, or one-off scrape/pricing artifacts. Local migration inputs should stay on disk only and be recreated from their source if needed.
