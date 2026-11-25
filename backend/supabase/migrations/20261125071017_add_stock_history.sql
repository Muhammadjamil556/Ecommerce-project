-- Stock history. Every stock change goes through one function, which changes the
-- quantity and records who did it and why, both or neither.

create type public.stock_change_reason as enum (
  'received', 'returned', 'damaged', 'correction'
);

-- Rows are never edited, so there is no updated_at.
create table public.stock_movements (
  id uuid primary key default gen_random_uuid(),
  variant_id uuid not null references public.product_variants (id) on delete cascade,
  change integer not null check (change <> 0 and change between -100000 and 100000),
  quantity_after integer not null check (quantity_after >= 0),
  reason public.stock_change_reason not null,
  note text check (char_length(note) between 1 and 300),
  -- Empty for changes made by a script, or when the account was deleted.
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create index stock_movements_variant_id_created_at_idx
  on public.stock_movements (variant_id, created_at desc);
create index stock_movements_created_by_idx on public.stock_movements (created_by);

revoke all on table public.stock_movements
  from public, anon, authenticated, service_role;
-- No policies, and nobody may insert, edit or delete history directly.
alter table public.stock_movements enable row level security;
grant select on table public.stock_movements to service_role;

-- From now on the backend cannot change a quantity without recording it.
revoke update (quantity) on table public.inventory from service_role;

-- "security definer" because service_role may not change these tables itself.
create function private.adjust_stock(
  p_variant_id uuid,
  p_change integer,
  p_reason public.stock_change_reason,
  p_note text,
  p_user_id uuid
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_quantity integer;
begin
  -- Locks the row, so simultaneous changes are added up instead of lost.
  -- Going below zero breaks the check on inventory.quantity and changes nothing.
  update public.inventory
  set quantity = quantity + p_change
  where variant_id = p_variant_id
  returning quantity into new_quantity;

  if new_quantity is null then
    raise exception 'Variant not found' using errcode = 'P0002';
  end if;

  insert into public.stock_movements
    (variant_id, change, quantity_after, reason, note, created_by)
  values
    (p_variant_id, p_change, new_quantity, p_reason, p_note, p_user_id);

  return new_quantity;
end;
$$;

-- The API can only call functions in the public schema.
create function public.adjust_stock(
  p_variant_id uuid,
  p_change integer,
  p_reason public.stock_change_reason,
  p_note text default null,
  p_user_id uuid default null
)
returns integer
language sql
set search_path = ''
as $$
  select private.adjust_stock(p_variant_id, p_change, p_reason, p_note, p_user_id);
$$;

revoke execute on function
  private.adjust_stock(uuid, integer, public.stock_change_reason, text, uuid)
  from public, anon, authenticated;
revoke execute on function
  public.adjust_stock(uuid, integer, public.stock_change_reason, text, uuid)
  from public, anon, authenticated;

grant usage on schema private to service_role;
grant execute on function
  private.adjust_stock(uuid, integer, public.stock_change_reason, text, uuid)
  to service_role;
grant execute on function
  public.adjust_stock(uuid, integer, public.stock_change_reason, text, uuid)
  to service_role;

-- One row per variant for the admin inventory screen.
create view public.inventory_overview
with (security_invoker = true) as
select
  v.id as variant_id,
  v.sku,
  v.name as variant_name,
  v.is_active,
  p.id as product_id,
  p.name as product_name,
  p.status as product_status,
  i.quantity,
  i.low_stock_threshold,
  i.quantity <= i.low_stock_threshold as is_low,
  v.sku || ' ' || p.brand || ' ' || p.name || ' ' || v.name as search_text
from public.inventory i
join public.product_variants v on v.id = i.variant_id
join public.products p on p.id = v.product_id;

revoke all on table public.inventory_overview
  from public, anon, authenticated, service_role;
grant select on table public.inventory_overview to service_role;

-- Stock that existed before history was recorded.
insert into public.stock_movements
  (variant_id, change, quantity_after, reason, note)
select variant_id, quantity, quantity, 'correction', 'Opening stock'
from public.inventory
where quantity > 0;
