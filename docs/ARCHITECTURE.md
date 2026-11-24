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

A 5xx response always carries a generic message. The real cause is written to the server log only.

## Database access

`SupabaseService` is the only place that creates Supabase clients.

| Method | Key | Row Level Security | Use for |
| --- | --- | --- | --- |
| `forUser(token)` | Publishable key and the user's token | Applies | Almost everything |
| `asSystem()` | Secret key | Bypassed | Admin and system work, after checking permissions in code |

Two database rules must both allow an operation: a **grant** decides whether a role may use a table or column at all, and a **policy** decides which rows.

| Table | Not logged in | Logged-in user | Backend system client |
| --- | --- | --- | --- |
| `profiles` | Nothing | Read own row; edit own name and phone | Everything |
| `user_roles` | Nothing | Read own role | Everything |

A trigger on `auth.users` creates both rows at sign-up. The role is always `customer`, whatever the sign-up request contains.

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
| Database security | Vitest against the real development project, `test/database.db-spec.ts` |
| Frontend logic | Vitest, `*.test.js` beside the code |

There are no automated frontend component tests yet. Screens are checked by hand in a browser.
