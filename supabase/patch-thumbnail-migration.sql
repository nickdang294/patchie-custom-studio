-- Store a small WebP image for patch picker cards; keep image_url for full-size mockups.
alter table public.patches add column if not exists thumbnail_url text;
