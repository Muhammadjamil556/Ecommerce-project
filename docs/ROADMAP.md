# Development Roadmap

**Current phase:** Phase 3, authentication and roles. Built and tested; waiting for one real password reset email. Registration emails and the first admin are done.

Status: `[ ]` not started, `[~]` in progress, `[x]` implemented and tested.

Each phase ends with a demo, test steps and an explanation. The next phase starts only after approval.

## Overview

| Phase | Name | What works at the end | Status |
| --- | --- | --- | --- |
| 0 | Planning | Documents and agreed architecture | `[x]` |
| 1 | Foundation | React page shows a live response from NestJS | `[x]` |
| 2 | Supabase connection | NestJS reads from the database; migrations work | `[x]` |
| 3 | Authentication and roles | Register, log in, protected and admin-only routes | `[~]` |
| 4 | Catalog API | Categories, products and variants through Swagger | `[ ]` |
| 5 | Admin catalog | Admin manages products, images and stock | `[ ]` |
| 6 | Storefront | Customers browse, search and filter real products | `[ ]` |
| 7 | Profile and addresses | Customers manage their account | `[ ]` |
| 8 | Cart and wishlist | Saved cart and wishlist | `[ ]` |
| 9 | Checkout and orders | A customer places an order (no online payment yet) | `[ ]` |
| 10 | Admin orders and customers | Admin processes orders and views customers | `[ ]` |
| 11 | Reviews | Ratings, reviews and moderation | `[ ]` |
| 12 | Coupons | Discounts applied safely at checkout | `[ ]` |
| 13 | Payments | Online payment in test mode | `[ ]` |
| 14 | Shipping and notifications | Shipments, tracking, customer updates | `[ ]` |
| 15 | Admin analytics | Dashboard built on real order data | `[ ]` |
| 16 | Hardening and deployment | Secure, tested, live application | `[ ]` |

The admin catalog comes before the storefront so the storefront shows real products from day one instead of mock data.

## Open decisions

D1 to D10 were approved on 2026-11-24. See [ARCHITECTURE.md](ARCHITECTURE.md).

### Needed later

| Before phase | Question |
| --- | --- |
| 8 | Can visitors keep a cart before logging in? |
| 9 | Is guest checkout allowed? How are tax and shipping fees calculated? |
| 13 | Payment provider (depends on the owner's country) |
| 14 | Email provider, and manual shipping or a carrier integration |
| 16 | Hosting for frontend and backend |

## Phase 0: Planning

- [x] Inspect the project directory
- [x] Check Node.js, npm and Git
- [x] Identify missing prerequisites
- [x] Write `CLAUDE.md`, `README.md` and this roadmap
- [x] Owner answers D1 to D5
- [x] Owner approves Phase 1

## Phase 1: Foundation

**Learn:** project setup, environment variables, CORS, how a request travels.

- [x] Initialise Git and `.gitignore`
- [x] First commit
- [x] Push to GitHub (public repository, owner's choice)
- [x] Record approved decisions in `docs/ARCHITECTURE.md`
- [x] Create `backend/` with NestJS: validated config, Swagger, global validation, response format, error filter, CORS
- [x] Create `frontend/` with Vite and React (JavaScript): Tailwind, Shadcn UI, React Router, Redux store, Axios client
- [x] Base layout, home page and 404 page
- [x] `GET /api/v1/health`, displayed by the frontend
- [x] `.env.example` in both apps

**Test:** start both apps, see the live health status, stop the backend and see a clear error. Both builds, lint and tests pass.

## Phase 2: Supabase connection

**Learn:** relational databases, migrations, grants, RLS.

- [x] Create the Supabase project (owner)
- [x] Set environment variables (owner)
- [x] Add the Supabase CLI to `backend/`
- [x] Link the project (owner)
- [x] First migration: `profiles`, `user_roles`, RLS, grants, profile creation on sign-up
- [x] NestJS Supabase module with user-scoped and secret-key clients
- [x] Health check includes the database
- [x] Database security tests, `npm run test:db`

**Test:** migration applies cleanly; a user cannot read another profile or change their own role, even when calling Supabase directly.

## Phase 3: Authentication and roles

**Learn:** JWTs, authentication and authorization, guards.

- [x] Log in, log out and reset password
- [x] Register, including a real confirmation email
- [~] Forgot password (tested without sending email; the real test hit Supabase's limit of 2 emails per hour)
- [x] Auth state in Redux; Axios attaches the access token
- [x] NestJS auth guard, roles guard and `@CurrentUser()`
- [x] `GET /api/v1/users/me`
- [x] Protected and admin routes in React
- [x] Documented way to create the first admin (README)
- [x] Create the first admin
- [x] Set the Supabase Site URL, redirect URL and minimum password length (owner)

**Test:** no token gives 401, customer on an admin route gives 403, admin gives 200; session survives a refresh.

## Phase 4: Catalog API

**Learn:** data modelling, CRUD, pagination, Swagger.

- [ ] `categories`, `products`, `product_variants`, `product_images`, `inventory`
- [ ] Public: list, details, search, filter, sort, paginate
- [ ] Admin: product, category and variant CRUD
- [ ] Seed script: 12 Nikon and DJI models with placeholder PKR prices (owner replaces them before launch)
- [ ] Check whether Wikimedia Commons has suitable openly licensed photos, and keep credit and license with each image
- [ ] Remove public `EXECUTE` from `rls_auto_enable()` (security advisor warning)

**Test:** all endpoints through Swagger; drafts stay hidden from the public; invalid input gives 400.

## Phase 5: Admin catalog

**Learn:** complex forms, tables, file uploads.

- [ ] Admin layout and navigation
- [ ] Category and product CRUD screens, including variants such as body only, lens kit or drone bundle
- [ ] Image upload to Supabase Storage with type and size checks
- [ ] Inventory screen with low-stock view and stock-change history

**Test:** create a product with variants and images; a customer cannot reach any admin function.

## Phase 6: Storefront

**Learn:** responsive design, URL state, reusable components.

- [ ] Responsive homepage, header, footer and category navigation
- [ ] Product listing with search, filters, sorting and pagination kept in the URL
- [ ] Product details with gallery, variant selection and stock status

**Test:** mobile, tablet and desktop; a filtered link still works when shared.

## Phase 7: Profile and addresses

- [ ] View and edit profile
- [ ] Address CRUD with a default address

**Test:** one user cannot read or change another user's address.

## Phase 8: Cart and wishlist

- [ ] `carts`, `cart_items`, `wishlist_items`
- [ ] Add, update and remove, with stock checks
- [ ] Wishlist, including move to cart

**Test:** cart survives logout and login; totals come from the server.

## Phase 9: Checkout and orders

**Learn:** transactions, race conditions, price integrity.

- [ ] `orders`, `order_items`, `order_status_history`
- [ ] Checkout: address, review, confirm
- [ ] `place_order` Postgres function: check stock, calculate total, create order, reduce stock, clear cart, all or nothing
- [ ] Protection against duplicate submission
- [ ] Order history and details

**Test:** tampered prices are ignored; two buyers cannot both get the last item; a failure leaves no partial order.

## Phase 10: Admin orders and customers

- [ ] Order list, filters and details
- [ ] Controlled status changes; cancelling restores stock
- [ ] Customer list and details

**Test:** invalid status changes are rejected; every change is recorded.

## Phase 11: Reviews and ratings

- [ ] Reviews limited to customers who bought the product, one per product
- [ ] Average rating and review list
- [ ] Admin moderation

**Test:** non-buyers and duplicate reviews are rejected.

## Phase 12: Discounts and coupons

- [ ] Percentage and fixed coupons with dates, limits and minimum spend
- [ ] Admin coupon CRUD
- [ ] Validated and applied inside order placement

**Test:** expired, overused and ineligible coupons are rejected, including under simultaneous use.

## Phase 13: Payments

**Learn:** webhooks, idempotency, test mode.

- [ ] `payments` and the chosen provider in test mode
- [ ] Verified webhook updates the order
- [ ] Failed payments, expired payments and refunds

**Test:** forged webhooks are rejected; a repeated webhook has no extra effect. Card details never reach our servers.

## Phase 14: Shipping and notifications

- [ ] Shipping methods and rates; shipments with tracking numbers
- [ ] Customer order tracking timeline
- [ ] In-app notifications and transactional email
- [ ] Email provider for login emails too: Supabase's built-in email is for testing only

**Test:** an admin status change appears in customer tracking and notifications; a failed email does not break an order.

## Phase 15: Admin analytics

- [ ] Revenue, order count, top products, low stock and new customers
- [ ] Date range filter, calculated in the database

**Test:** figures match a manual SQL check.

## Phase 16: Hardening and deployment

- [ ] Security review of RLS, grants, guards and rate limiting
- [ ] End-to-end tests for the main journeys
- [ ] Performance, accessibility and SEO pass, including loading pages separately to reduce the first download
- [ ] GitHub Actions for lint, test and build
- [ ] Separate production Supabase project, backups and monitoring
- [ ] Deployment and release checklist

**Test:** full customer and admin journeys on the live site.
