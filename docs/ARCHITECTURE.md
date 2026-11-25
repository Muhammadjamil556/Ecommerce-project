# Architecture

How the application is designed and which decisions have been approved. For progress, see the [roadmap](ROADMAP.md).

## Approved decisions (2026-11-24)

| ID | Decision | Reason | Trade-off |
| --- | --- | --- | --- |
| D1 | The browser uses supabase-js for authentication only; all other data goes through NestJS | Supabase handles token refresh, email confirmation and password reset | The publishable key is public, so the database must protect itself |
| D2 | NestJS uses supabase-js, plus Postgres functions for multi-step operations; no ORM | Fewer tools, and RLS stays useful | Some SQL to learn |
| D3 | NestJS uses the user's token by default; the secret key only for admin and system work | RLS still protects data if backend code misses a check | Two clients to understand |
| D4 | Hosted Supabase development project; migrations in `backend/supabase/migrations/` | No Docker needed | Development needs an internet connection |
| D5 | One Git repository holding both independent apps | One history, simpler setup | None significant at this size |
| D6 | Users confirm their email before logging in | Nobody can register with someone else's address | Depends on email delivery |
| D7 | Email and password login only | Simple to start; other methods can be added | No social login yet |
| D8 | One currency, Pakistani rupees (PKR), stored as whole paisa | Simple and exact | No other currencies |
| D9 | The store sells Nikon and DJI cameras and drones | Owner's choice | Variants are options such as body only or lens kit, not only size and color |
| D10 | The store's own database is the product catalog. A seed script adds about 12 real models; images need permission or an open license | No official Nikon or DJI catalog API was found; the store does not depend on another company | Details, prices and image credits are maintained by us |

## Request flow

What happens when the home page checks the backend. Every later feature follows the same path.

```text
ApiStatus.jsx             the component dispatches fetchHealth()
  healthSlice.js          the thunk calls the API and stores loading, data or error
    healthApi.js          knows the URL
      apiClient.js        shared Axios instance: base URL and timeout
        ---- HTTP: GET /api/v1/health ----
        main.ts           CORS check, /api/v1 prefix
          ValidationPipe  checks the input
            health.controller.ts    handles HTTP
              health.service.ts     business logic
          ResponseInterceptor       wraps the result as { data }
          AllExceptionsFilter       formats any error as { error }
```

## Response format

Success:

```json
{ "data": { "status": "ok" } }
```

Error:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": ["name must be a string"]
  }
}
```

A page of a list adds `"meta": { "page": 1, "limit": 12, "total": 30, "totalPages": 3 }`.

A 5xx response always carries a generic message. The real cause is written to the server log only.

## Authentication and authorization

Authentication asks who you are (401 if unknown). Authorization asks what you may do (403 if not allowed).

```text
1. LoginPage       sends email and password to Supabase Auth (not to NestJS)
2. Supabase        returns a short-lived access token; supabase-js stores and refreshes it
3. authListener    notices the login and loads the profile and role from NestJS into Redux
4. apiClient       adds "Authorization: Bearer <token>" to every API request
5. AuthGuard       verifies the token's signature, expiry, project and audience
6. RolesGuard      for @Roles() routes, reads the role from the database
7. Controller      receives the verified user through @CurrentUser()
```

- **Every API route needs login unless it is marked `@Public()`.** Forgetting a decorator leaves a route closed, not open.
- Roles are read on each admin request, so removing a role works immediately even though the old token is still valid.
- Redux holds the profile and role but not the token. Route guards in React are for convenience only.
- Tokens are verified locally with Supabase's public keys. An unreachable Supabase gives 503, not 401, so users are not logged out by an outage.
- Registration and password reset give the same answer for known and unknown addresses.
- The password reset form opens only from an email link.
- supabase-js keeps the session in `localStorage`, so a script injected into the site could read it. Never render untrusted HTML.

## Database access

`SupabaseService` is the only place that creates Supabase clients.

| Method | Key | Row Level Security | Use for |
| --- | --- | --- | --- |
| `forUser(token)` | Publishable key and the user's token | Applies | Work for a logged-in user |
| `asVisitor()` | Publishable key | Applies | Public data, such as the catalog |
| `asSystem()` | Secret key | Bypassed | Admin and system work, after checking permissions in code |

Two database rules must both allow an operation: a **grant** decides whether a role may use a table or column at all, and a **policy** decides which rows.

| Table | Not logged in | Logged-in user | Backend system client |
| --- | --- | --- | --- |
| `profiles` | Nothing | Read own row; edit own name and phone | Everything |
| `user_roles` | Nothing | Read own role | Everything |
| `categories` | Read active | Read active | Everything, except IDs and dates |
| `products`, `product_variants`, `product_images` | Read if published, in an active category (variants: active) | Same | Everything, except IDs, dates and `is_in_stock` |
| `inventory` | Nothing | Nothing | Read; change quantity and threshold |
| `product_summaries` (view) | Same rows as above | Same | Read |

A trigger on `auth.users` creates both rows at sign-up. The role is always `customer`, whatever the sign-up request contains.

## Catalog

```text
categories 1---* products 1---* product_variants 1---1 inventory
                          1---* product_images
```

- A **variant** is what a customer buys (body only, lens kit, color). It has the SKU and price. Every product needs at least one to be published.
- Status: `draft` (new), `published` (on sale), `archived` (hidden). Only drafts can be deleted.
- Exact stock stays private. A trigger copies only "in stock or not" to the variant, and the backend cannot set that directly.
- `product_summaries` gives lists one row per product with its lowest price, availability and main image. It is a `security_invoker` view, so RLS still applies.
- Search looks for every typed word in the brand, name and description. It suits a small catalog; a larger one would need a search index.
- The price filter matches when a product's price range overlaps the requested range.
- The check that a published product keeps an active variant is made before saving. If two admins act at the same moment it could be missed; the product is then hidden, not shown empty.
- Product photos need a credit and license. Uploading comes in Phase 5.

## Backend layers

| Folder | Purpose |
| --- | --- |
| `src/config/` | Environment validation, shared app settings, Swagger |
| `src/common/` | Code used by every feature: error filter, response interceptor, decorators |
| `src/supabase/` | Supabase clients |
| `src/modules/` | One folder per feature |
| `supabase/migrations/` | Database changes as SQL files |

The server refuses to start if an environment variable is missing or invalid. Swagger is disabled when `NODE_ENV=production`.

## Frontend layers

| Folder | Purpose |
| --- | --- |
| `src/app/` | Redux store and routes |
| `src/components/ui/` | Generated Shadcn UI components |
| `src/components/common/`, `layout/` | Shared pages and layouts |
| `src/features/` | One folder per feature |
| `src/lib/` | Axios client, error conversion, environment validation |

`toApiError` converts every failure (API error, timeout, no connection) into one shape, so components never handle Axios errors.

## Testing

| What | Tool |
| --- | --- |
| Backend units | Vitest, `*.spec.ts` beside the code |
| Backend HTTP behaviour | Vitest and Supertest, `test/*.e2e-spec.ts` |
| Database security | Vitest against the real development project, `test/*.db-spec.ts` |
| Frontend logic | Vitest, `*.test.js` beside the code |

There are no automated frontend component tests yet. Screens are checked by hand in a browser.
