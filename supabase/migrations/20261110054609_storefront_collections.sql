-- Additive storefront schema. Existing orders, settings, catalog and inventory are untouched.
create table public.storefront_groups (
 id uuid primary key default gen_random_uuid(),
 name text not null check(char_length(name) between 1 and 60),
 sort_order integer not null default 0,
 active boolean not null default true,
 created_at timestamptz not null default now()
);
create unique index storefront_groups_name on public.storefront_groups(lower(name));
create table public.storefront_entries (
 id uuid primary key default gen_random_uuid(),
 kind text not null check(kind in ('collection','look')),
 name text not null check(char_length(name) between 1 and 100),
 description text not null default '' check(char_length(description)<=2000),
 group_ids uuid[] not null default '{}',
 patch_items jsonb not null default '[]' check(jsonb_typeof(patch_items)='array'),
 product_design_id text references public.product_designs(id) on delete set null,
 related_collection_id uuid references public.storefront_entries(id) on delete set null,
 shopee_url text not null default '',
 sale_type text not null default 'finished' check(sale_type in ('finished','patch_set','base')),
 includes_base boolean not null default false,
 image_url text not null default '',
 thumbnail_url text not null default '',
 image_mode text not null default 'auto' check(image_mode in ('auto','upload')),
 source_image_url text not null default '',
 template text not null default 'stitched' check(template in ('stitched','sticker','minimal')),
 tone text not null default 'lavender' check(tone in ('lavender','mint','peach')),
 active boolean not null default false,
 sort_order integer not null default 0,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create index storefront_entries_public_page on public.storefront_entries(kind,sort_order,id) where active;
create index storefront_entries_admin_page on public.storefront_entries(kind,sort_order,id);
create index storefront_entries_groups on public.storefront_entries using gin(group_ids);
create index storefront_entries_design on public.storefront_entries(product_design_id);
create index storefront_entries_collection on public.storefront_entries(related_collection_id);
alter table public.storefront_groups enable row level security;
alter table public.storefront_entries enable row level security;
-- The Next.js API owns public field selection and admin authorization.
revoke all on public.storefront_groups,public.storefront_entries from anon,authenticated;
grant select,insert,update,delete on public.storefront_groups,public.storefront_entries to service_role;
insert into public.storefront_groups(name,sort_order) values ('K-pop',10),('Tình yêu',20),('Dễ thương',30);
