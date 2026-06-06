# Deploying Modempic on Vercel (monorepo / `web/`)

The Git repository root is **`Modempic/`** (root `package.json` only proxies scripts into **`web/`**). The runnable Next.js app—`next.config.ts`, `package.json`, `src/app/`—all live under **`web/`**.

If the Vercel project **Root Directory** is left at the repository root:

- Install/build **can succeed** (`npm run build` at repo root delegates to **`web`**), so logs show green checks and phrases like **`Build Completed in /vercel/output`**.
- However, the deployed URL can still show **`404: NOT_FOUND` / `Code: NOT_FOUND`** for every route, because Vercel’s Next.js routing is tied to the **Root Directory**. With the wrong root, artifacts under **`web/.next`** don’t line up with what the CDN expects next to **`path0`** (repo root).

## Fix (required)

1. Open [Vercel Dashboard](https://vercel.com/dashboard) → your **modempic** project → **Settings** → **Build & Deployment**.
2. Under **Root Directory**, click **Edit** and set **`web`** (lowercase, no slashes). Click **Continue** until you can **Save** (do not navigate away until it is persisted).
3. In the **same** Settings page, scroll to **Framework Preset** → should be **Next.js**. Under **Root Directory**, open **advanced** only if needed and ensure **Output Directory is not overridden** (leave empty for Next.js).
4. Redeploy: **Deployments** → latest → **⋯** → **Redeploy**. Uncheck “use build cache” once if you had changed settings earlier.

Recommended after Root Directory **= `web`**:

- **Install Command:** default **`npm install`** (runs inside **`web/`**).
- **Build Command:** default **`npm run build`** from **`web/package.json`**.

Do **not** set a custom **Output Directory** for Next.js.

## Confirm it’s really fixed (build logs sanity check)

Open the failing deployment → **Building** → scroll the log:

- Paths should repeatedly reference **`web/`** as the install/build context once Root Directory is set (e.g. dependency install and `next build` resolving from **`web`**).
- You should **not** be relying only on **`npm --prefix web`** overrides at repo root—that pattern can still confuse deployment output unless Root Directory **`web`** is set.

If Root Directory **`web`** is already set and it still fails, paste the **Framework Preset**, **Install Command**, **Build Command**, and **Root Directory** values from Settings (screenshot or text)—plus the first screen of **Build Logs** after “Cloning…”.

## Env vars

Set **Production** / **Preview** variables in **Settings → Environment Variables** (`DATABASE_URL`, `AUTH_SECRET`, etc.) the same way you use them locally (`web/.env.local` logic).

## Database migrations (required after schema changes)

Production builds run **`prisma migrate deploy`** before **`next build`** (see `web/package.json`). Vercel must have **`DATABASE_URL`** available at **build time** so pending migrations (e.g. `20260515120000_coupon_rules` for coupons) apply before the app serves traffic.

If `/admin/coupons` shows an application error after deploy:

1. Open the deployment **Build** logs and confirm `prisma migrate deploy` succeeded.
2. Or run locally against production: `cd web && npm run db:migrate:deploy` (with production `DATABASE_URL` in `.env.local`).
3. Redeploy once migrations are applied.

## Email funnel cron (recovery drips)

Endpoint: **`/api/cron/email-funnels`** — processes welcome / abandoned-cart / unpaid-order follow-ups.

Transactional emails (order placed, paid, shipped, welcome #1) still send **immediately**; only drip follow-ups use this cron.

**Use one scheduler only** (GitHub Actions *or* cron-job.org *or* Vercel Pro cron — not two at once).

### Recommended: GitHub Actions (in this repo)

Workflow: **`.github/workflows/email-funnels-cron.yml`** — runs every **30 minutes** on the default branch.

1. GitHub → **modempic** repo → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**:
   - **`CRON_SECRET`** — same random string as Vercel Production `CRON_SECRET` (16+ chars).
   - **`CRON_FUNNEL_URL`** — full production URL, e.g. `https://modempic.com/api/cron/email-funnels`.
2. Ensure **`CRON_SECRET`** is also set in **Vercel → Environment Variables** (Production) so the API can verify the request.
3. After push to `main`, open **Actions** → **Email funnel cron** → confirm runs succeed (or use **Run workflow** once).

To change frequency, edit the `cron:` line in the workflow (GitHub allows intervals down to **5 minutes**).

### Alternative: cron-job.org (manual setup in their dashboard)

We do **not** configure cron-job.org from code — you create the job in their UI if you prefer it over GitHub Actions:

1. Sign up at [cron-job.org](https://cron-job.org).
2. **Create cronjob** → URL: `https://YOUR_DOMAIN/api/cron/email-funnels`.
3. Schedule: e.g. every **30 minutes**.
4. **Advanced** → Request method **GET** → Header: `Authorization: Bearer YOUR_CRON_SECRET`.
5. Disable or delete the GitHub Actions workflow (or pause the cron-job) so only one scheduler runs.

### Vercel Cron (optional, Pro only on frequent schedules)

Vercel **Hobby** allows **once per day** only; frequent `vercel.json` crons fail deploy. **Pro** can use `vercel.json` crons instead of GitHub/cron-job.org if you prefer.

### Manual test

```bash
curl -H "Authorization: Bearer YOUR_CRON_SECRET" https://YOUR_DOMAIN/api/cron/email-funnels
```

Cron delivery is best-effort; each run reconciles all enrollments with `nextSendAt <= now` (idempotent).

## Repo note

`web/next.config.ts` sets **`outputFileTracingRoot`** to the repo parent (folder that contains **`web/`**). That matches Vercel’s clone layout when Root Directory is **`web`** and silences ambiguous lockfile tracing; it does **not** replace the Root Directory setting above.
