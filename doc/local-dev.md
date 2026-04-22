# Local development

## Internal Server Error on Windows (ENOENT under `.next`)

If the terminal shows `ENOENT` for `.next/static/development/_buildManifest.js` or `app-build-manifest.json`, that is often **Turbopack** racing on Windows. Use the default dev command (webpack), not Turbopack:

- `npm run dev` — recommended
- `npm run dev:turbo` — optional; if you see ENOENT/500, stop the server, delete the `web/.next` directory, and use `npm run dev` again.

## Database

Set a real `DATABASE_URL` in `web/.env`. If `DATABASE_URL` is missing in development, the app may use a placeholder URL and Prisma queries can fail or log warnings.
