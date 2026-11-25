# Progress

Short hand-over for a new session. Keep it under 60 lines: replace old text, do not add a diary. Details are in the [roadmap](ROADMAP.md) and [architecture](ARCHITECTURE.md).

**Last updated:** 2026-11-25. Phases 0 to 4 are done and pushed (`a383e9c`).

**Next:** Phase 5, admin catalog. Not started; needs the owner's approval. Suggested split: **5A** layout, categories, products and variants; **5B** photos and inventory.

## What works

| Area | State |
| --- | --- |
| Accounts | Register, confirm email, log in, log out, reset password (real emails tested); admin and customer roles |
| Catalog API | Public list, search, filters, sorting, details; admin CRUD for categories, products and variants |
| Website | Home, auth pages, account page, admin summary page. **No product or admin catalog screens yet** |
| Development database | 3 migrations applied; 5 categories, 12 published products, 24 variants; 1 admin, 1 customer |

Last full check (2026-11-25): backend 57 unit, 65 end-to-end, 36 real-project tests; frontend 55 tests; lint, types and builds pass.

## Open items

| Item | When |
| --- | --- |
| Stock can be changed only in the database; the API has no stock endpoint | Phase 5B, with history |
| No image upload, storage bucket or product photos | Phase 5B |
| Photos: open-license candidates found through Openverse for 11 of 12 products (none for DJI RS 4). Not looked at yet; confirm each license at its source | Phase 5B |
| Prices and stock are placeholders; variant and bundle names unconfirmed | Owner, before launch |
| Email service (Brevo suggested): Supabase's built-in limit is very low | Before launch, or sooner if it blocks work |
| Leaked password protection is off; JavaScript bundle is large | Phase 16 |

## Where to look

Read only what the task needs.

| Task | Start with |
| --- | --- |
| Admin screens | `frontend/src/features/admin/`, `app/router.jsx`, `app/store.js`, `components/layout/` |
| Form pattern | `frontend/src/features/auth/pages/RegisterPage.jsx`, `auth/schemas/`, `components/common/FormField.jsx` |
| API call pattern | `frontend/src/features/admin/api/adminApi.js`, `lib/apiClient.js`, `lib/apiError.js` |
| Catalog endpoints and DTOs | `backend/src/modules/products/`, `backend/src/modules/categories/` |
| Shared backend helpers | `backend/src/common/` |
| Tables, grants, RLS | `backend/supabase/migrations/*_create_catalog.sql` |
| Test patterns | `backend/test/catalog.e2e-spec.ts`, `backend/test/catalog.db-spec.ts` |

## Easy to miss

- The Supabase CLI labels the project "production". The owner confirmed on 2026-11-24 that it is for development only.
- `service_role` has column-level grants, so a Supabase `upsert` on variants fails. `is_in_stock` is set only by a trigger.
- Supabase password rules: 8 or more characters with lowercase, uppercase, digit and symbol. Test passwords must meet them.
- `test:db` creates and deletes its own `db-test-` rows in the development project. Check that none remain.
- `commons.wikimedia.org` does not load on the owner's network; Openverse and `upload.wikimedia.org` do.
- Before a commit, the secret scan must prove that its rules work (positive control) and stop on any error.
- The owner runs both development servers (ports 3000 and 5173). Leave them running.
