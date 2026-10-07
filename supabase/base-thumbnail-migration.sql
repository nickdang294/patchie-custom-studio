alter table public.products
  add column if not exists thumbnail_images jsonb not null default '{}'::jsonb;
