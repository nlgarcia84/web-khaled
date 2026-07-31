## Development

When starting the dev server, use background mode:

```
astro dev --background
```

Manage the background server with `astro dev stop`, `astro dev status`, and `astro dev logs`.

---

## API Routes

All routes are under `src/pages/api/` as Astro API endpoints (SSR on Vercel). Base URL: `https://www.khaledhuerta.com`

### Payments

| Route | Method | Description | Key Env Vars |
|---|---|---|---|
| `/api/create-checkout` | POST | Stripe Checkout session. Body: `{ amount, campaignSlug? }`. Redirects to Stripe. | `STRIPE_SECRET_KEY` |
| `/api/create-paypal-order` | POST | PayPal order. Body: `{ amount, campaignSlug? }`. Returns `{ id }`. | `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET` |
| `/api/capture-paypal-order` | POST | Capture approved PayPal order + update Sanity `raised`. Body: `{ orderID, campaignSlug? }`. | `SANITY_TOKEN`, `PAYPAL_CLIENT_SECRET` |
| `/api/webhooks/stripe` | POST | Stripe webhook (legacy, old path). Deprecated in favor of `/api/stripe/webhook`. | `STRIPE_WEBHOOK_SECRET` |
| `/api/stripe/webhook` | POST | Stripe webhook (current). Handles `checkout.session.completed` (updates Sanity `raised`) and `charge.refunded` (logs). | `STRIPE_WEBHOOK_SECRET`, `SANITY_TOKEN` |
| `/api/webhooks/paypal` | POST | PayPal IPN webhook (backup). Validates with PayPal, updates Sanity `raised` if `custom` param matches a campaign slug. | `SANITY_TOKEN` |

### Other

| Route | Method | Description |
|---|---|---|
| `/api/contact` | POST | Contact form. Sends email via Resend to `kane.wwe@gmail.com`. Body: FormData `{ nombre, email, mensaje }`. | `RESEND_API_KEY` |

### Payment Flow

**Stripe:**
1. Frontend → `POST /api/create-checkout` with `{ amount, campaignSlug }`
2. Returns Stripe session URL → browser redirects to Stripe Checkout
3. User completes payment → Stripe calls `POST /api/stripe/webhook`
4. Webhook verifies signature (`STRIPE_WEBHOOK_SECRET`) → increments `raised` on Sanity campaign document

**PayPal:**
1. Frontend loads PayPal SDK with `PUBLIC_PAYPAL_CLIENT_ID`
2. Button click → `POST /api/create-paypal-order` → returns order ID
3. User approves in PayPal popup → `POST /api/capture-paypal-order` → captures payment + updates Sanity
4. IPN backup: PayPal also calls `POST /api/webhooks/paypal` with payment details

**General donations** (no `campaignSlug`): logged but not tracked in Sanity.

---

## Sanity CMS

**Studio URL:** `https://khaled-blog.sanity.studio/`
**API:** Server-side via `src/lib/sanity.ts`. Read-only `client` (CDN cached) and `writeClient` (token-authenticated for mutations).

### Schema Types (`studio/schemaTypes/`)

| Type | File | Fields | Used By |
|---|---|---|---|
| `post` | `post.ts` | title, slug, author, excerpt, image, body, publishedAt, categories | `/blog` listing, `/blog/[slug]` detail |
| `category` | `category.ts` | title, description | Blog categories |
| `campaign` | `campaign.ts` | title, slug, goal, raised, description, active | `/donar` progress bar, Stripe/PayPal webhooks update `raised` |
| `stream` | `stream.ts` | title, channelId, chatEnabled | `/jutbas` — channelId queried via YouTube Data API to detect live streams |
| `documento` | `documento.ts` | title, fileId, type (pdf/docx/other), description | `/biblioteca` — Google Drive embeds + modal preview |
| `blockContent` | `blockContent.ts` | Portable Text blocks | Blog post body content |

### Sanity Queries (`src/lib/sanity.ts`)

| Function | GROQ Query | Returns |
|---|---|---|
| `getPosts()` | `*[_type == "post"] \| order(publishedAt desc)` | All posts with basic fields + category titles |
| `getPost(slug)` | `*[_type == "post" && slug.current == $slug][0]` | Single post with body |
| `getCampaign(slug)` | `*[_type == "campaign" && slug.current == $slug][0]` | Campaign with goal, raised, active |
| `getStream()` | `*[_type == "stream"][0]` | Stream config with channelId, chatEnabled |
| `getDocumentos()` | `*[_type == "documento"] \| order(title asc)` | All documents with fileId, type |

### Environment Variables (Sanity)

| Variable | Purpose | Client/Server |
|---|---|---|
| `SANITY_TOKEN` | Write token for mutations (webhook → campaign raised) | Server only (`import.meta.env`) |

---

## Relevant Libraries

### `src/lib/paypal.ts`
PayPal REST API helpers:
- `getAccessToken()` — OAuth2 client credentials
- `createPayPalOrder(amount, campaignSlug?)` — Creates order with EUR currency, stores campaignSlug in `purchase_units[0].custom_id`
- `capturePayPalOrder(orderID)` — Captures approved order

### `src/lib/youtube.ts`
YouTube Data API:
- `getLiveStream(channelId)` — Queries `search?eventType=live` and returns `{ videoId, title, thumbnail }` or `null`

### `src/lib/feeds.ts`
External data scraping:
- `getLatestInstagramPost(username)` — Scrapes Instagram profile HTML for latest post
- `getLatestTelegramPost(username)` — Scrapes Telegram public channel HTML

---

## Environment Variables Checklist

| Variable | Required | Vercel | Local `.env` |
|---|---|---|---|
| `STRIPE_SECRET_KEY` | Yes | `sk_live_...` | Same |
| `STRIPE_WEBHOOK_SECRET` | Yes | `whsec_...` | Same |
| `SANITY_TOKEN` | Yes | `sk...` | Same |
| `RESEND_API_KEY` | Yes | `re_...` | Same |
| `PUBLIC_PAYPAL_CLIENT_ID` | Optional | Live Client ID | Same |
| `PAYPAL_CLIENT_ID` | Optional | Live Client ID | Same |
| `PAYPAL_CLIENT_SECRET` | Optional | Live Secret | Same |
| `YOUTUBE_API_KEY` | Optional | API Key | Same |

---

## Documentation

Full documentation: https://docs.astro.build

Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)
