# Modempic Web App

This folder contains the runnable Modempic application: Next.js App Router, Prisma/PostgreSQL, Auth.js, Resend email, crypto checkout integrations, social proof, admin, and tests.

Most day-to-day commands can be run from the repository root. If you are already inside `web/`, use the commands below directly.

## Development

```bash
npm install
npm run db:migrate:deploy
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

If you hit **500** in local dev, especially on Windows, see [../doc/local-dev.md](../doc/local-dev.md).

## Verification

```bash
npm run db:validate
npm run lint
npm run test
npm run build
```

`npm run build` runs `prisma migrate deploy` before `next build`, so it requires a valid `DATABASE_URL`.

## Deployment

Vercel Root Directory must be set to `web`. Do not deploy from the repository root unless Vercel has explicitly been configured to use this folder. See [../doc/vercel-deployment.md](../doc/vercel-deployment.md).

## App Structure

- `src/app/(site)` - storefront, cart, checkout, account, blog, and policy routes.
- `src/app/(admin)` - staff/admin interface.
- `src/app/api` - auth, chat, social proof, and payment webhook routes.
- `src/components` - storefront, shop, social proof, UI, SEO, and email-related components.
- `src/lib` - server actions, data access, payments, email, domain logic, auth helpers, and utilities.
- `prisma` - schema, migrations, and seed script.
- `scripts` - migration/import/maintenance tooling.

## Notes

- Keep secrets in `.env.local`; never commit `.env*`.
- Payment setup is documented in [../doc/payments.md](../doc/payments.md).
- Local PostgreSQL is available through [../compose.yml](../compose.yml).
