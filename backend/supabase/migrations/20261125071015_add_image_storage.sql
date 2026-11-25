-- Storage for product photos.
--
-- The bucket is public: anyone who has a photo's address can open it, including photos
-- of drafts. Addresses contain a random ID, so they cannot be guessed. There are no
-- policies on storage.objects, so the browser cannot list, upload or delete files:
-- only NestJS can, with the secret key.

-- NestJS converts every upload to WebP, so nothing else is accepted.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 5242880, array['image/webp'])
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Lets the store reserve space for a photo before it loads. The table is still empty.
alter table public.product_images
  add column width integer not null check (width > 0),
  add column height integer not null check (height > 0);

grant insert (width, height) on table public.product_images to service_role;

-- Sets the order of all photos of a product at once. The first is the main photo.
create function public.reorder_product_images(p_product_id uuid, p_image_ids uuid[])
returns void
language plpgsql
set search_path = ''
as $$
begin
  -- The list must contain every photo of this product exactly once.
  if (
    select array_agg(id order by id)
    from public.product_images
    where product_id = p_product_id
  ) is distinct from (
    select array_agg(image_id order by image_id)
    from unnest(p_image_ids) as image_id
  ) then
    raise exception 'The list does not match the photos of this product'
      using errcode = 'P0001';
  end if;

  update public.product_images as i
  set sort_order = o.position - 1
  from unnest(p_image_ids) with ordinality as o (image_id, position)
  where i.id = o.image_id;
end;
$$;

revoke execute on function public.reorder_product_images(uuid, uuid[])
  from public, anon, authenticated;
grant execute on function public.reorder_product_images(uuid, uuid[]) to service_role;
