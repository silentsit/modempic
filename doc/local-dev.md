# Local development

## "Internal Server Error" on the home page (dev)

If **`http://localhost:3000`** (or your usual port) shows a plain text **Internal Server Error** but the app builds successfully, the dev server on that port is often **stale** (zombie `node` after a crash, or an old `next` process). **Stop all dev servers** for this project, delete `web/.next`, then run `npm run dev` again. You can confirm the app works by running `npx next dev -p 3002` and opening that URL. Avoid leaving **`NODE_ENV=development`** set in your system/shell when running `next build`—Next.js expects a normal environment for builds.

## Internal Server Error on Windows (ENOENT under `.next`)

If the terminal shows `ENOENT` for `.next/static/development/_buildManifest.js` or `app-build-manifest.json`, that is often **Turbopack** racing on Windows. Use the default dev command (webpack), not Turbopack:

- `npm run dev` — recommended
- `npm run dev:turbo` — optional; if you see ENOENT/500, stop the server, delete the `web/.next` directory, and use `npm run dev` again.

## Database

Set a real `DATABASE_URL` in `web/.env`. If `DATABASE_URL` is missing in development, the app may use a placeholder URL and Prisma queries can fail or log warnings.
