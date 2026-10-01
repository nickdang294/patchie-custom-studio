alter table public.products
  add column if not exists snap_guide_enabled boolean not null default true,
  add column if not exists snap_attraction_enabled boolean not null default true,
  add column if not exists snap_strength_percent numeric(5,2) not null default 45;
