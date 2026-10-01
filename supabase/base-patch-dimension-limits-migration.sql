-- Add optional allowed patch dimensions per base product.
-- Run once in Supabase SQL Editor before deploying the matching app version.
alter table public.products add column if not exists min_patch_width_cm numeric(5,2);
alter table public.products add column if not exists max_patch_width_cm numeric(5,2);
alter table public.products add column if not exists min_patch_height_cm numeric(5,2);
alter table public.products add column if not exists max_patch_height_cm numeric(5,2);
