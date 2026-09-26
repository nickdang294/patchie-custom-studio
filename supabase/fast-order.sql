-- Run once in Supabase SQL Editor for the fast order flow.
-- Orders can be created before their mockup upload finishes.
alter table public.designs alter column image_path drop not null;

-- Product groups use stable ids stored in product_type; the display label is
-- editable in settings, so custom groups must not be restricted to shirt/bag.
alter table public.products drop constraint if exists products_product_type_check;
alter table public.products add column if not exists size_guide text not null default '';

alter table public.designs drop constraint if exists designs_status_check;
alter table public.designs
  add constraint designs_status_check
  check (status in ('processing','new','review','confirmed','completed','closed'));

update storage.buckets
set allowed_mime_types = array['image/png','image/webp']
where id = 'design-mockups';
