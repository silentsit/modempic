# Deploying Modempic on Vercel (monorepo / `web/`)

The Git repository root is **`Modempic/`** (root `package.json` only proxies scripts into **`web/`**). The runnable Next.js app—`next.config.ts`, `package.json`, `src/app/`—all live under **`web/`**.

If the Vercel project **Root Directory** is left at the repository root:

- Install/build can still succeed if you run commands that delegate to `web/` (for example root `npm run build`).
- Vercel’s Next.js deployment layer expects the compiled app at the **project root** it is configured with. Output actually lands at **`web/.next`**. The deployment can show **Ready** while the preview returns **`404 NOT_FOUND`** / **`Code: NOT_FOUND`** for every route.

## Fix (required)

1. Open [Vercel Dashboard](https://vercel.com/dashboard) → your **modempic** project → **Settings** → **Build & Deployment**.
2. Under **Root Directory**, click **Edit** and set **`web`** (literally three characters: lowercase `web`). Save.
3. Redeploy: **Deployments** → open latest → **⋯** → **Redeploy** (or push a commit after saving).

Recommended after that:

- **Framework Preset:** Next.js (auto from `web/package.json`).
- **Build Command:** `npm run build` (runs in **`web`**).
- **Install Command:** leave default **`npm install`** (runs in **`web`**).

Do **not** set a custom **Output Directory** for Next.js.

## Env vars

Set **Production** / **Preview** variables in **Settings → Environment Variables** (`DATABASE_URL`, `AUTH_SECRET`, etc.) the same way you use them locally (`web/.env.local` logic).

## Repo note

`web/next.config.ts` sets **`outputFileTracingRoot`** to the repo parent (folder that contains **`web/`**). That matches Vercel’s clone layout when Root Directory is **`web`** and silences ambiguous lockfile tracing; it does **not** replace the Root Directory setting above.
