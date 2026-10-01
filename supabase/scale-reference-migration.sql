-- Add optional per-base scale reference fields without changing existing products.
alter table public.products
  add column if not exists reference_width_cm numeric(7,2),
  add column if not exists reference_height_cm numeric(7,2),
  add column if not exists image_fit_percent numeric(5,2);
