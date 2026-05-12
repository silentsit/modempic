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

## Repo note

`web/next.config.ts` sets **`outputFileTracingRoot`** to the repo parent (folder that contains **`web/`**). That matches Vercel’s clone layout when Root Directory is **`web`** and silences ambiguous lockfile tracing; it does **not** replace the Root Directory setting above.
