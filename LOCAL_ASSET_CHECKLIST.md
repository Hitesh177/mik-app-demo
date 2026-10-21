# Local Asset Checklist

## Completed

- [x] Product catalog data is stored in the app and SQLite database.
- [x] All available product images are stored under `public/products/`.
- [x] Seed product image paths use `/products/...` instead of remote URLs.
- [x] Existing SQLite product image paths use `/products/...`.
- [x] Legacy JSON product image paths use `/products/...`.
- [x] Product and blog prerendered SEO pages use local product images.
- [x] Google Fonts was removed; the storefront uses a local system font stack.
- [x] Content Security Policy blocks arbitrary remote product images.
- [x] Admin product create/edit rejects external image URLs.
- [x] Production build and lint pass.
- [x] Browser audit reports no remote or broken images on the home page.

## Owner Follow-up

- [ ] Replace the local placeholder for the 18 products whose old source image was already unavailable.
- [ ] Confirm the business owns or is licensed to use every migrated product image.
- [ ] Add a first-party image upload workflow and object storage before non-technical admins manage products in production.
- [ ] Set `MIK_PUBLIC_SITE_URL` to the real HTTPS domain before the production build so canonical URLs and the sitemap do not use localhost.
- [ ] Configure Google OAuth credentials and approved production origins when the owner provides access.
- [ ] Replace the demo WhatsApp number with the store's real business number.

## Intentional External Services

These are integrations, not hosted storefront assets:

- Google Identity scripts and endpoints are required only for Google sign-in.
- WhatsApp links intentionally open `wa.me` for customer support.
- `schema.org` URLs in JSON-LD are identifiers for search engines and do not load page assets.
- The production canonical domain and API host will be external once deployed.

