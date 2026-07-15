# MIK Store

Indian grocery storefront and admin app for Taiwan, built with React, Vite, and a local Node + SQLite backend.

## Security Notes

The app now uses cookie-based auth plus CSRF protection for authenticated writes. For production deployment:

- Serve the app over HTTPS.
- Set `MIK_COOKIE_SECURE=1` so auth and CSRF cookies are marked `Secure`.
- Set `MIK_ALLOWED_ORIGINS` to only the real frontend origins you trust.
- Keep `MIK_AUTH_SECRET` strong and unique per environment.
- Keep `MIK_MAX_BODY_BYTES` conservative to reduce abuse from oversized payloads.
- Set `MIK_PUBLIC_SITE_URL` to the canonical storefront URL so sitemap and robots metadata point to the real domain.

## Local Development

- `npm run dev` starts the frontend on Vite.
- `npm run api` starts the backend API on `127.0.0.1:4173`.
- `npm run smoke` runs the full end-to-end security and data-flow smoke suite.
