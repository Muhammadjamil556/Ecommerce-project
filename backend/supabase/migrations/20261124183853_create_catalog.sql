-- Product catalog: categories, products, variants, images and stock.
--
-- Visitors may read published products only. Nobody can write through the public API:
-- NestJS makes every change with the secret key, after checking the admin role.

create type public.product_status as enum ('draft', 'published', 'archived');

-- Tables ----------------------------------------------------------------------

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 80),
  slug text not null unique
    check (char_length(slug) <= 100 and slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  description text check (char_length(description) <= 500),
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories (id) on delete restrict,
  name text not null check (char_length(name) between 1 and 150),
  slug text not null unique
    check (char_length(slug) <= 180 and slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  brand text not null check (char_length(brand) between 1 and 60),
  description text not null default '' check (char_length(description) <= 5000),
  -- Example: {"Sensor": "Full frame", "Weight": "910 g"}
  specifications jsonb not null default '{}'
    check (jsonb_typeof(specifications) = 'object'),
  status public.product_status not null default 'draft',
  search_text text not null
    generated always as (brand || ' ' || name || ' ' || description) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- What the customer actually buys. Every product needs at least one.
create table public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  sku text not null unique check (sku ~ '^[A-Z0-9]+(-[A-Z0-9]+)*$' and char_length(sku) <= 60),
  name text not null check (char_length(name) between 1 and 100),
  -- Example: {"Kit": "Body only"}
  options jsonb not null default '{}' check (jsonb_typeof(options) = 'object'),
  -- In paisa: Rs 1,000 is 100000.
  price_minor integer not null check (price_minor > 0),
  is_active boolean not null default true,
  -- Kept in step with inventory by a trigger, so exact stock can stay private.
  is_in_stock boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (product_id, name)
);

create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  -- Path inside the Supabase Storage bucket, which arrives with image upload.
  storage_path text not null unique check (char_length(storage_path) between 1 and 300),
  alt_text text not null check (char_length(alt_text) between 1 and 200),
  -- Who made the photo and why we may use it.
  credit text not null check (char_length(credit) between 1 and 200),
  license text not null check (char_length(license) between 1 and 100),
  source_url text check (source_url ~ '^https://' and char_length(source_url) <= 500),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.inventory (
  variant_id uuid primary key references public.product_variants (id) on delete cascade,
  quantity integer not null default 0 check (quantity >= 0),
  low_stock_threshold integer not null default 5 check (low_stock_threshold >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index products_category_id_idx on public.products (category_id);
create index products_status_created_at_idx on public.products (status, created_at desc);
create index product_images_product_id_idx on public.product_images (product_id);

-- One row per product for lists: lowest price, availability and main image.
-- "security_invoker" applies the reader's own grants and policies to the view.
create view public.product_summaries
with (security_invoker = true) as
select
  p.id,
  p.name,
  p.slug,
  p.brand,
  p.status,
  p.search_text,
  p.created_at,
  p.updated_at,
  c.id as category_id,
  c.name as category_name,
  c.slug as category_slug,
  v.min_price_minor,
  v.max_price_minor,
  coalesce(v.is_in_stock, false) as is_in_stock,
  i.storage_path as image_path,
  i.alt_text as image_alt
from public.products p
join public.categories c on c.id = p.category_id
left join lateral (
  select
    min(price_minor) as min_price_minor,
    max(price_minor) as max_price_minor,
    bool_or(is_in_stock) as is_in_stock
  from public.product_variants
  where product_id = p.id and is_active
) v on true
left join lateral (
  select storage_path, alt_text
  from public.product_images
  where product_id = p.id
  order by sort_order, id
  limit 1
) i on true;

-- Grants: which operations each API role may attempt --------------------------

revoke all on table
  public.categories, public.products, public.product_variants,
  public.product_images, public.inventory, public.product_summaries
  from public, anon, authenticated, service_role;

-- Anyone may read the catalog; policies below decide which rows. Not inventory.
grant select on table
  public.categories, public.products, public.product_variants,
  public.product_images, public.product_summaries
  to anon, authenticated;

grant select, delete on table
  public.categories, public.products, public.product_variants, public.product_images
  to service_role;
grant select on table public.product_summaries, public.inventory to service_role;

-- Only editable columns: not IDs, timestamps, or is_in_stock.
grant
  insert (name, slug, description, is_active, sort_order),
  update (name, slug, description, is_active, sort_order)
  on table public.categories to service_role;
grant
  insert (category_id, name, slug, brand, description, specifications, status),
  update (category_id, name, slug, brand, description, specifications, status)
  on table public.products to service_role;
grant
  insert (product_id, sku, name, options, price_minor, is_active, sort_order),
  update (sku, name, options, price_minor, is_active, sort_order)
  on table public.product_variants to service_role;
grant
  insert (product_id, storage_path, alt_text, credit, license, source_url, sort_order),
  update (alt_text, credit, license, source_url, sort_order)
  on table public.product_images to service_role;
-- A trigger creates the row, so inserting is not needed.
grant update (quantity, low_stock_threshold) on table public.inventory to service_role;

-- Row Level Security: which rows they may see ---------------------------------

alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.product_images enable row level security;
-- No policies for inventory, so only the backend can read it.
alter table public.inventory enable row level security;

create policy "Anyone can read active categories"
  on public.categories for select to anon, authenticated
  using (is_active);

create policy "Anyone can read published products in active categories"
  on public.products for select to anon, authenticated
  using (
    status = 'published'
    and exists (
      select 1 from public.categories c
      where c.id = category_id and c.is_active
    )
  );

-- The products policy also applies inside these two subqueries.
create policy "Anyone can read active variants of visible products"
  on public.product_variants for select to anon, authenticated
  using (
    is_active
    and exists (select 1 from public.products p where p.id = product_id)
  );

create policy "Anyone can read images of visible products"
  on public.product_images for select to anon, authenticated
  using (exists (select 1 from public.products p where p.id = product_id));

-- Triggers --------------------------------------------------------------------

create trigger categories_set_updated_at
  before update on public.categories
  for each row execute function private.set_updated_at();
create trigger products_set_updated_at
  before update on public.products
  for each row execute function private.set_updated_at();
create trigger product_variants_set_updated_at
  before update on public.product_variants
  for each row execute function private.set_updated_at();
create trigger product_images_set_updated_at
  before update on public.product_images
  for each row execute function private.set_updated_at();
create trigger inventory_set_updated_at
  before update on public.inventory
  for each row execute function private.set_updated_at();

-- "security definer" because service_role may not insert inventory or set is_in_stock.
create function private.create_variant_inventory()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.inventory (variant_id) values (new.id);
  return new;
end;
$$;

create function private.sync_variant_stock()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.product_variants
  set is_in_stock = new.quantity > 0
  where id = new.variant_id and is_in_stock is distinct from (new.quantity > 0);
  return new;
end;
$$;

revoke execute on function private.create_variant_inventory() from public;
revoke execute on function private.sync_variant_stock() from public;

create trigger product_variants_create_inventory
  after insert on public.product_variants
  for each row execute function private.create_variant_inventory();

create trigger inventory_sync_variant_stock
  after insert or update of quantity on public.inventory
  for each row execute function private.sync_variant_stock();
