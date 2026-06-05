# Google sign-in setup (Modempic)

## Required Vercel env vars

Set in **Vercel → Project → Settings → Environment Variables** (Production + Preview):

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `AUTH_URL` = `https://modempic.com`
- `NEXT_PUBLIC_SITE_URL` = `https://modempic.com`

Redeploy after saving.

## Google Cloud Console

1. [Google Cloud Console](https://console.cloud.google.com/) → **APIs & Services → Credentials**
2. Open your **OAuth 2.0 Client ID** (type: **Web application**)
3. Under **Authorized redirect URIs**, add exactly:

```text
https://modempic.com/api/auth/callback/google
```

4. Save. Changes can take a few minutes.

Optional for Vercel preview deployments:

```text
https://modempic-git-main-silentsittt-gmailcoms-projects.vercel.app/api/auth/callback/google
```

## Verify redirect URI

After deploy, open:

```text
https://modempic.com/api/auth/oauth-setup
```

The `googleRedirectUri` value must match an entry in Google Console **character-for-character**.

## Common errors

| Error | Fix |
|-------|-----|
| `redirect_uri_mismatch` | Add the exact `googleRedirectUri` above in Google Console |
| No “Continue with Google” button | Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in Vercel and redeploy |
| `Access blocked` (app in Testing) | OAuth consent screen → add test users, or publish the app |

## Password login note

`info@modempic.com` is the primary admin email. Running `npm run db:seed` no longer overwrites existing admin passwords unless `SEED_RESET_PASSWORDS=1`.

Reset admin password against the **same** database Vercel uses:

```bash
cd web
node scripts/reset-info-admin.cjs
```

Requires `SEED_ADMIN_PASSWORD` or `ADMIN_PASSWORD` in `.env.local` pointing at that database.
