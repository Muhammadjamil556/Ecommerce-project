# Ecommerce Project

A full-stack ecommerce application with a customer storefront and an admin dashboard.

> **Status: foundation.** Both apps run and talk to each other. Store features are not built yet. See the [roadmap](docs/ROADMAP.md).

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

The target layout. `products` is an example of a feature that comes later; `health` is the working one today.

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
npm run start:dev
```

Frontend, in a second terminal:

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

| Address | What it is |
| --- | --- |
| http://localhost:5173 | Website |
| http://localhost:3000/api/v1/health | API health check |
| http://localhost:3000/api/docs | Swagger documentation |

Press `Ctrl+C` in a terminal to stop that app. Restart an app after changing its `.env` file.

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

The backend also has `npm run test:e2e`.

## Common problems

| Problem | Likely cause |
| --- | --- |
| Website says "Cannot reach the server" | The backend is not running, or `VITE_API_URL` is wrong |
| Browser console shows a CORS error | `FRONTEND_URL` in `backend/.env` does not match the website address. `localhost` and `127.0.0.1` count as different |
| `EADDRINUSE` or "Port 5173 is already in use" | The app is already running in another terminal |
| "Invalid environment variables" | `.env` is missing or has a wrong value. Compare it with `.env.example` |
| Backend cannot find a module you just created | Relative imports must end in `.js`, even for `.ts` files |

## Documentation

- [Roadmap](docs/ROADMAP.md): phases, progress and open decisions
- [Architecture](docs/ARCHITECTURE.md): design, decisions and request flow
- [CLAUDE.md](CLAUDE.md): working, security and coding rules
