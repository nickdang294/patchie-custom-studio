-- Per-base scale fields and drag-and-drop snap points/lines.
-- Safe to run on an existing products table; existing rows retain their current behavior.
alter table public.products
  add column if not exists reference_width_cm numeric(7,2),
  add column if not exists reference_height_cm numeric(7,2),
  add column if not exists image_fit_percent numeric(5,2),
  add column if not exists snap_points jsonb not null default '[]'::jsonb,
  add column if not exists snap_guides jsonb not null default '[]'::jsonb;


alter table public.products
  add column if not exists snap_guide_enabled boolean not null default true,
  add column if not exists snap_attraction_enabled boolean not null default true,
  add column if not exists snap_strength_percent numeric(5,2) not null default 45;
