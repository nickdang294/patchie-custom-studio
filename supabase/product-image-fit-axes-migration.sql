-- Add a separate vertical image occupancy percentage for product mockups.
-- Existing rows can remain NULL; the storefront will temporarily reuse image_fit_percent.
alter table public.products
  add column if not exists image_fit_height_percent numeric(5,2);
