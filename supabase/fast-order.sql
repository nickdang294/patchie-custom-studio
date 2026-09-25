-- Run once in Supabase SQL Editor for the fast order flow.
-- Orders can be created before their mockup upload finishes.
alter table public.designs alter column image_path drop not null;

alter table public.designs drop constraint if exists designs_status_check;
alter table public.designs
  add constraint designs_status_check
  check (status in ('processing','new','review','confirmed','completed','closed'));

update storage.buckets
set allowed_mime_types = array['image/png','image/webp']
where id = 'design-mockups';
