-- Patchie: add release status to existing patch records.
-- Run once in Supabase SQL Editor for an already-created database.

alter table public.patches
  add column if not exists release_status text not null default 'released';

alter table public.patches
  drop constraint if exists patches_release_status_check;

alter table public.patches
  add constraint patches_release_status_check
  check (release_status in ('released','coming_soon'));

update public.patches
set release_status = 'released'
where release_status is null
   or release_status not in ('released','coming_soon');
