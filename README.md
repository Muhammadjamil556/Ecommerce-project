# Ecommerce Project

A full-stack ecommerce application with a customer storefront and an admin dashboard.

> **Status: foundation.** Both apps run and talk to each other. Registration, login, roles and the product API work. The store pages are not built yet. See the [roadmap](docs/ROADMAP.md).

## Planned features

- **Storefront:** categories, product listings, search, filters, variants, reviews
- **Customer:** account, addresses, cart, wishlist, checkout, order history and tracking
- **Admin:** analytics, products, categories, inventory, orders, customers, reviews
- **Additional:** coupons, notifications, payments, shipping

## Technology

| Area | Technology |
| --- | --- |
| Frontend | React, Vite, JavaScript, Tailwind CSS, Shadcn UI, React Router, Redux Toolkit, Axios, React Hook Form, Zod, Lucide React |
| Backend | NestJS, TypeScript, REST, Swagger |
| Database and services | Supabase PostgreSQL, Auth and Storage, with Row Level Security |

## Architecture

```text
+----------------+   HTTP + access token   +----------------+   supabase-js   +----------------+
| React frontend | ----------------------> | NestJS backend | --------------> | Supabase       |
| localhost:5173 | <---------------------- | localhost:3000 | <-------------- | DB and Storage |
+----------------+          JSON           +----------------+                 +----------------+
        |                                                                             ^
        +----------------------- sign up / log in (Supabase Auth) --------------------+
```

- **Frontend** displays pages and collects input.
- **Backend** holds the business rules, verifies users and checks permissions.
- **Supabase** stores data and images and manages user accounts. Row Level Security is a second layer of protection.

## Structure

The target layout. `products` works in the backend today; its frontend folder comes later.

```text
Ecommerce-project/
├── CLAUDE.md                    Project rules
├── README.md
├── docs/
│   ├── ARCHITECTURE.md
│   └── ROADMAP.md
├── frontend/
│   └── src/
│       ├── app/                 Redux store, router, providers
│       ├── components/
│       │   ├── ui/              Shadcn UI components
│       │   ├── common/          Shared components
│       │   └── layout/          Storefront and admin layouts
│       ├── features/            One folder per feature
│       │   └── products/
│       │       ├── api/         API calls
│       │       ├── components/
│       │       ├── pages/
│       │       ├── schemas/     Zod schemas
│       │       └── productsSlice.js
│       ├── hooks/
│       ├── lib/                 Axios and Supabase clients
│       └── utils/
└── backend/
    ├── src/
    │   ├── main.ts              Starts the server
    │   ├── app.module.ts        Connects all modules
    │   ├── config/              Environment validation
    │   ├── common/              Guards, filters, interceptors, decorators
    │   ├── supabase/            Supabase clients
    │   └── modules/             One folder per feature
    │       └── products/
    │           ├── dto/
    │           ├── products.controller.ts
    │           ├── products.service.ts
    │           └── products.module.ts
    ├── supabase/
    │   └── migrations/          Database changes as SQL files
    └── test/
```

## Prerequisites

| Tool | Requirement |
| --- | --- |
| Node.js | 24.x (24.15 or later) |
| npm | 11 or later |
| Git | 2.x |
| Supabase account | Needed from Phase 2 |
| GitHub account | For hosting the repository |

Docker is not needed when using a hosted Supabase project. The NestJS and Supabase CLIs will run through `npx`, so no global installation is needed.

## Setup

Clone the repository, then run the following from its root folder.

Backend:

```bash
cd backend
npm install
cp .env.example .env
```

Fill in the three Supabase values in `backend/.env`. They are in the Supabase dashboard under Project Settings. Then connect to the project and apply the database migrations:

```bash
npx supabase login
npx supabase link
npx supabase db push --remote --dry-run
npx supabase db push --remote
npm run start:dev
```

To add 12 sample products (real models, **placeholder prices and stock**), run `npm run seed` in `backend/`. It skips anything that already exists and refuses to run when `NODE_ENV=production`.

Frontend, in a second terminal:

```bash
cd frontend
npm install
cp .env.example .env
```

Fill in the two Supabase values in `frontend/.env` (the URL and the **publishable** key, never the secret key), then:

```bash
npm run dev
```

| Address | What it is |
| --- | --- |
| http://localhost:5173 | Website |
| http://localhost:3000/api/v1/health | API and database health check |
| http://localhost:3000/api/docs | Swagger documentation |

Press `Ctrl+C` in a terminal to stop that app. Restart an app after changing its `.env` file.

### Supabase settings

In the Supabase dashboard, under Authentication:

| Setting | Value |
| --- | --- |
| Site URL | `http://localhost:5173` |
| Redirect URLs | `http://localhost:5173/**` |
| Confirm email | On |
| Minimum password length | 8 |
| Password requirements | Lowercase, uppercase letters, digits and symbols |

Supabase's built-in email service is for testing only and sends very few emails per hour (the limit can change), only to members of your Supabase organization.

### Create the first admin

Register and confirm your email on the website, then run this in the Supabase SQL Editor with your own address:

```sql
update public.user_roles
set role = 'admin'
where user_id = (select id from auth.users where email = 'you@example.com');
```

It should report one changed row. Reload the website to see the Admin link. There is no way to become an admin through the website or the API.

### Try the admin API in Swagger

1. Log in on the website as an admin.
2. In the browser's developer tools, open Application > Local Storage > `http://localhost:5173`. In the entry ending in `-auth-token`, copy the value of `access_token`.
3. Open http://localhost:3000/api/docs, choose **Authorize** and paste it.

The token works like your password until it expires. Never share it or commit it.

### Optional: Supabase MCP for Claude Code

Lets Claude Code inspect the **development** project: tables, logs and advisors. This setup can also **change the database**, so keep tool confirmations on and never use it with production.

Run in the project's root folder. Replace `YOUR_PROJECT_REF` with the ID at the start of your Supabase URL:

```bash
claude mcp add --scope local --transport http supabase "https://mcp.supabase.com/mcp?project_ref=YOUR_PROJECT_REF&features=database,debugging,development,docs"
```

Then run `claude /mcp`, choose **supabase**, then **Authenticate**. Add `&read_only=true` to the address to prevent SQL from changing data. To remove it: `claude mcp remove supabase --scope local`.

### Environment variables

| App | Variable | Secret? | Used from |
| --- | --- | --- | --- |
| frontend | `VITE_API_URL` | No | Phase 1 |
| frontend | `VITE_SUPABASE_URL` | No | Phase 3 |
| frontend | `VITE_SUPABASE_PUBLISHABLE_KEY` | No, protected by RLS | Phase 3 |
| backend | `NODE_ENV`, `PORT`, `FRONTEND_URL` | No | Phase 1 |
| backend | `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` | No | Phase 2 |
| backend | `SUPABASE_SECRET_KEY` | **Yes** | Phase 2 |

Every `VITE_` variable is visible to anyone using the website. Never put a secret in one, and never commit `.env` files.

## Checks

Run in either app:

```bash
npm run lint
npm run format:check
npm test
npm run build
```

The backend also has:

- `npm run typecheck`: TypeScript check, including test files
- `npm run test:e2e`: HTTP tests with a fake database
- `npm run test:db`: security tests against the real development project. Creates temporary users and deletes them afterwards. Never point it at production

## Common problems

| Problem | Likely cause |
| --- | --- |
| Website says "Cannot reach the server" | The backend is not running, or `VITE_API_URL` is wrong |
| Browser console shows a CORS error | `FRONTEND_URL` in `backend/.env` does not match the website address. `localhost` and `127.0.0.1` count as different |
| `EADDRINUSE` or "Port 5173 is already in use" | The app is already running in another terminal |
| "Invalid environment variables" | `.env` is missing or has a wrong value. Compare it with `.env.example` |
| "API connected, but the database is not responding" | Migration not applied, wrong key, or the Supabase project is paused. The backend terminal shows the reason |
| Email link opens the wrong address | The Supabase Site URL and Redirect URLs are not set as described above |
| No email arrives | Check spam. The built-in email service may have reached its limit, or may not send to that address |
| "Too many emails were sent" | The built-in email limit. Wait, then try again |
| API returns 401 | Not logged in, or the token expired |
| API returns 403 | Logged in, but without the required role |
| API returns 409 | The request conflicts with existing data, such as a slug that is already used |
| A product is missing from the public API | It is not published, its category is inactive, or it has no active variant |
| "permission denied for table" | A migration is missing a `GRANT` for that role |
| A query returns no rows and no error | Row Level Security is hiding them |
| Backend cannot find a module you just created | Relative imports must end in `.js`, even for `.ts` files |

## Documentation

- [Progress](docs/PROGRESS.md): current state and open items
- [Roadmap](docs/ROADMAP.md): phases, progress and open decisions
- [Architecture](docs/ARCHITECTURE.md): design, decisions and request flow
- [CLAUDE.md](CLAUDE.md): working, security and coding rules
