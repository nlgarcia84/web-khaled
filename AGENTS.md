## Desarrollo

Al iniciar el servidor de desarrollo, usar modo background:

```
astro dev --background
```

Gestionar el servidor con `astro dev stop`, `astro dev status` y `astro dev logs`.

---

## Rutas API

Todas las rutas están en `src/pages/api/` como endpoints API de Astro (SSR en Vercel). URL base: `https://www.khaledhuerta.com`

### Pagos

| Ruta | Método | Descripción | Variables de entorno clave |
|---|---|---|---|
| `/api/create-checkout` | POST | Sesión de Stripe Checkout. Body: `{ amount, campaignSlug? }`. Redirige a Stripe. | `STRIPE_SECRET_KEY` |
| `/api/create-paypal-order` | POST | Orden de PayPal. Body: `{ amount, campaignSlug? }`. Retorna `{ id }`. | `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET` |
| `/api/capture-paypal-order` | POST | Captura orden aprobada de PayPal + actualiza `raised` en Sanity. Body: `{ orderID, campaignSlug? }`. | `SANITY_TOKEN`, `PAYPAL_CLIENT_SECRET` |
| `/api/stripe/webhook` | POST | Webhook de Stripe. Maneja `checkout.session.completed` (actualiza `raised` en Sanity) y `charge.refunded` (registra en logs). | `STRIPE_WEBHOOK_SECRET`, `SANITY_TOKEN` |

### Otras

| Ruta | Método | Descripción |
|---|---|---|
| `/api/contact` | POST | Formulario de contacto. Envía email vía Resend a `kane.wwe@gmail.com`. Body: FormData `{ nombre, email, mensaje }`. `RESEND_API_KEY` |

### Flujo de pago

**Stripe:**
1. Frontend → `POST /api/create-checkout` con `{ amount, campaignSlug }`
2. Retorna URL de sesión de Stripe → el navegador redirige a Stripe Checkout
3. El usuario completa el pago → Stripe llama a `POST /api/stripe/webhook`
4. El webhook verifica la firma (`STRIPE_WEBHOOK_SECRET`) → incrementa `raised` en el documento de campaña de Sanity

**PayPal:**
1. Frontend carga PayPal SDK con `PUBLIC_PAYPAL_CLIENT_ID`
2. Click en botón → `POST /api/create-paypal-order` → retorna ID de orden
3. Usuario aprueba en popup de PayPal → `POST /api/capture-paypal-order` → captura el pago + actualiza Sanity

**Donaciones generales** (sin `campaignSlug`): se registran en logs pero no se rastrean en Sanity.

---

## Sanity CMS

**URL del Studio:** `https://khaled-blog.sanity.studio/`
**API:** Lado servidor vía `src/lib/sanity.ts`. Cliente de solo lectura `client` (cache CDN) y `writeClient` (autenticado con token para mutaciones).

### Tipos de esquema (`studio/schemaTypes/`)

| Tipo | Archivo | Campos | Usado por |
|---|---|---|---|
| `post` | `post.ts` | title, slug, author, excerpt, image, body, publishedAt, categories | Listado `/blog`, detalle `/blog/[slug]` |
| `category` | `category.ts` | title, description | Categorías del blog |
| `campaign` | `campaign.ts` | title, slug, goal, raised, description, active | Barra de progreso en `/donar`, webhooks Stripe/PayPal actualizan `raised` |
| `stream` | `stream.ts` | title, channelId, chatEnabled | `/jutbas` — channelId consultado vía YouTube Data API para detectar directos |
| `documento` | `documento.ts` | title, fileId, type (pdf/docx/other), description | `/biblioteca` — embeds de Google Drive + vista previa en modal |
| `blockContent` | `blockContent.ts` | Bloques Portable Text | Contenido del cuerpo de los posts del blog |

### Consultas de Sanity (`src/lib/sanity.ts`)

| Función | Consulta GROQ | Retorna |
|---|---|---|
| `getPosts()` | `*[_type == "post"] \| order(publishedAt desc)` | Todos los posts con campos básicos + títulos de categoría |
| `getPost(slug)` | `*[_type == "post" && slug.current == $slug][0]` | Un solo post con cuerpo |
| `getCampaign(slug)` | `*[_type == "campaign" && slug.current == $slug][0]` | Campaña con goal, raised, active |
| `getStream()` | `*[_type == "stream"][0]` | Configuración de stream con channelId, chatEnabled |
| `getDocumentos()` | `*[_type == "documento"] \| order(title asc)` | Todos los documentos con fileId, type |

### Variables de entorno (Sanity)

| Variable | Propósito | Cliente/Servidor |
|---|---|---|
| `SANITY_TOKEN` | Token de escritura para mutaciones (webhook → campaña raised) | Solo servidor (`import.meta.env`) |

---

## Librerías relevantes

### `src/lib/paypal.ts`
Helpers de la API REST de PayPal:
- `getAccessToken()` — OAuth2 client credentials
- `createPayPalOrder(amount, campaignSlug?)` — Crea orden con moneda EUR, guarda campaignSlug en `purchase_units[0].custom_id`
- `capturePayPalOrder(orderID)` — Captura una orden aprobada

### `src/lib/youtube.ts`
YouTube Data API:
- `getLiveStream(channelId)` — Consulta `search?eventType=live` y retorna `{ videoId, title, thumbnail }` o `null`

---

## Checklist de variables de entorno

| Variable | Requerida | Vercel | `.env` local |
|---|---|---|---|
| `STRIPE_SECRET_KEY` | Sí | `sk_live_...` | Igual |
| `STRIPE_WEBHOOK_SECRET` | Sí | `whsec_...` | Igual |
| `SANITY_TOKEN` | Sí | `sk...` | Igual |
| `RESEND_API_KEY` | Sí | `re_...` | Igual |
| `PUBLIC_PAYPAL_CLIENT_ID` | Opcional | Live Client ID | Igual |
| `PAYPAL_CLIENT_ID` | Opcional | Live Client ID | Igual |
| `PAYPAL_CLIENT_SECRET` | Opcional | Live Secret | Igual |
| `YOUTUBE_API_KEY` | Opcional | API Key | Igual |

---

## Documentación

Documentación completa: https://docs.astro.build

Consultar estas guías antes de trabajar en tareas relacionadas:

- [Agregar páginas, rutas dinámicas o middleware](https://docs.astro.build/en/guides/routing/)
- [Trabajar con componentes de Astro](https://docs.astro.build/en/basics/astro-components/)
- [Usar componentes React, Vue, Svelte u otros frameworks](https://docs.astro.build/en/guides/framework-components/)
- [Agregar o gestionar contenido](https://docs.astro.build/en/guides/content-collections/)
- [Agregar estilos o usar Tailwind](https://docs.astro.build/en/guides/styling/)
- [Soportar múltiples idiomas](https://docs.astro.build/en/guides/internationalization/)
