-- Patchie bulk import + recommendation metadata
-- Run once in Supabase SQL Editor after the existing schema has been applied.
alter table public.patches
  add column if not exists tags text[] not null default '{}',
  add column if not exists recommended_patch_ids text[] not null default '{}';

create index if not exists patches_tags_gin_idx
  on public.patches using gin (tags);

comment on column public.patches.tags is
  'Curated matching labels used by the patch recommendation feature.';
comment on column public.patches.recommended_patch_ids is
  'Patch IDs explicitly recommended alongside this patch.';
