-- Run once before deploying product design suggestions.
create table if not exists public.product_designs (
  id text primary key default replace(gen_random_uuid()::text, '-', ''),
  name text not null,
  product_id text not null references public.products(id) on delete cascade,
  placements jsonb not null default '[]'::jsonb,
  min_matches integer not null default 1 check (min_matches > 0),
  priority integer not null default 0,
  active boolean not null default true,
  thumbnail_path text not null,
  thumbnail_url text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists product_designs_lookup_idx on public.product_designs(product_id, active, priority desc);
alter table public.product_designs enable row level security;
grant all on table public.product_designs to service_role;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-design-thumbnails', 'product-design-thumbnails', true, 524288, array['image/webp'])
on conflict (id) do update set public = true, file_size_limit = 524288, allowed_mime_types = array['image/webp'];
