-- Patchie Studio schema. Run this once in Supabase SQL Editor.
create extension if not exists pgcrypto;

create table if not exists public.products (
  id text primary key default ('base-' || replace(gen_random_uuid()::text,'-','')),
  base_key text,
  sku text,
  product_type text not null default 'shirt' check (product_type in ('shirt','bag')),
  name text not null,
  color text not null,
  hex text not null default '#f5f1e8',
  image_url text not null default '/assets/blank-tee.webp',
  view_images jsonb not null default '{}'::jsonb,
  sizes text[] not null default array['S','M','L','XL'],
  price integer,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.patches (
  id text primary key default ('patch-' || replace(gen_random_uuid()::text,'-','')),
  name text not null,
  image_url text not null,
  width_cm numeric(5,2) not null default 1,
  height_cm numeric(5,2) not null default 1,
  patch_group text not null default 'Best Seller',
  patch_groups text[] not null default array['Best Seller'],
  quote text not null default '',
  price integer,
  stock_quantity integer not null default 20,
  sold_count integer not null default 0,
  is_featured boolean not null default false,
  is_new boolean not null default false,
  active boolean not null default true,
  sort_order integer not null default 100,
  created_at timestamptz not null default now()
);

create table if not exists public.settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.designs (
  id text primary key,
  customer_name text not null,
  customer_phone text not null default '',
  shipping_address text not null default '',
  size text not null,
  mode text not null check (mode in ('diy','shop')),
  product_id text references public.products(id) on delete set null,
  product_price integer not null default 0,
  total_price integer not null default 0,
  patches jsonb not null default '[]'::jsonb,
  note text not null default '',
  image_path text not null,
  status text not null default 'new' check (status in ('new','review','confirmed','completed','closed')),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);

create index if not exists designs_created_at_idx on public.designs(created_at desc);
create index if not exists designs_expires_at_idx on public.designs(expires_at);

alter table public.products add column if not exists sku text;
alter table public.products add column if not exists base_key text;
alter table public.products add column if not exists product_type text not null default 'shirt';
alter table public.products add column if not exists view_images jsonb not null default '{}'::jsonb;
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'products_product_type_check'
  ) then
    alter table public.products add constraint products_product_type_check check (product_type in ('shirt','bag'));
  end if;
end $$;
alter table public.patches add column if not exists quote text not null default '';
alter table public.patches add column if not exists patch_group text not null default 'Best Seller';
alter table public.patches add column if not exists patch_groups text[] not null default array['Best Seller'];
alter table public.patches add column if not exists stock_quantity integer not null default 20;
alter table public.patches add column if not exists sold_count integer not null default 0;
alter table public.patches add column if not exists is_featured boolean not null default false;
alter table public.patches add column if not exists is_new boolean not null default false;
alter table public.designs add column if not exists customer_phone text not null default '';
alter table public.designs add column if not exists shipping_address text not null default '';
alter table public.designs add column if not exists product_price integer not null default 0;
alter table public.designs add column if not exists total_price integer not null default 0;
update public.products
set view_images = jsonb_build_object('front', image_url)
where view_images = '{}'::jsonb or view_images is null;
update public.products
set sku = 'BASE-OFFWHITE'
where id = 'base-offwhite' and sku is null;
update public.products
set base_key = product_type || '::' || lower(trim(name))
where base_key is null or base_key = '';
update public.products
set product_type = 'shirt'
where product_type is null;

alter table public.products enable row level security;
alter table public.patches enable row level security;
alter table public.settings enable row level security;
alter table public.designs enable row level security;

drop policy if exists "Public can read active products" on public.products;
create policy "Public can read active products" on public.products for select using (active = true);
drop policy if exists "Public can read active patches" on public.patches;
create policy "Public can read active patches" on public.patches for select using (active = true);
-- Writes use the server-only service role after admin authentication.

insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('patch-assets','patch-assets',true,4194304,array['image/png','image/jpeg','image/webp'])
on conflict (id) do update set public=true, file_size_limit=4194304, allowed_mime_types=array['image/png','image/jpeg','image/webp'];
insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('design-mockups','design-mockups',false,3145728,array['image/png'])
on conflict (id) do update set public=false, file_size_limit=3145728, allowed_mime_types=array['image/png'];

insert into public.products (id,base_key,sku,product_type,name,color,hex,image_url,view_images,sizes,active)
values ('base-offwhite','shirt::áo thun oversized','BASE-OFFWHITE','shirt','Áo thun oversized','Off-white','#f5f1e8','/assets/blank-tee.webp','{"front":"/assets/blank-tee.webp"}'::jsonb,array['S','M','L','XL'],true)
on conflict (id) do nothing;
insert into public.patches (id,name,image_url,width_cm,height_cm,patch_group,patch_groups,active,sort_order) values
('patch-pink','Mũ xanh lá','/assets/patch-pink-cap.webp',4,4,'Best Seller',array['Best Seller'],true,10),
('patch-black','Mặt nạ xanh','/assets/patch-black-green.webp',4,4,'Limited',array['Limited'],true,20),
('patch-red','Mũ vàng','/assets/patch-red-white.webp',4,4,'Seasonal',array['Seasonal'],true,30),
('patch-yellow','Mũ xanh dương','/assets/patch-yellow-blue.webp',4,4,'Cute Animal',array['Cute Animal'],true,40)
on conflict (id) do nothing;
update public.patches set patch_group = 'Best Seller' where patch_group is null or patch_group = '';
update public.patches set stock_quantity = 20 where stock_quantity is null;
update public.patches set sold_count = 0 where sold_count is null;
update public.patches
set patch_groups = array[coalesce(nullif(patch_group,''),'Best Seller')]
where patch_groups is null or array_length(patch_groups,1) is null;
update public.patches set quote = 'nhỏ xíu mà có võ' where id='patch-pink' and quote='';
update public.patches set quote = 'bí ẩn một chút mới vui' where id='patch-black' and quote='';
update public.patches set quote = 'đội mood vui lên áo' where id='patch-red' and quote='';
update public.patches set quote = 'hôm nay hơi đáng yêu' where id='patch-yellow' and quote='';
insert into public.settings(key,value) values
('messengerUrl','""'::jsonb),
('sizes','["S","M","L","XL"]'::jsonb),
('retentionDays','30'::jsonb),
('privacyText','"Shop dùng thông tin này để xử lý yêu cầu thiết kế. Bản mẫu lưu 30 ngày."'::jsonb),
('adminEmails','[]'::jsonb)
on conflict (key) do nothing;
insert into public.settings(key,value) values
('market','{"brand":"Patch Market","eyebrow":"PATCHIE MARKET","title":"Những miếng patch bạn thích, mua riêng cũng được.","subtitle":"Chọn patch lẻ, gom vào giỏ và gửi mã đơn cho shop qua Messenger.","bannerImageUrl":"","bannerLink":"","bannerBadge":"NEW DROP"}'::jsonb)
on conflict (key) do nothing;

create table if not exists public.patch_orders (
  id text primary key default ('PM-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,8))),
  customer_name text not null,
  customer_phone text not null default '',
  shipping_address text not null default '',
  total_price integer not null default 0,
  note text not null default '',
  status text not null default 'new' check (status in ('new','confirmed','completed','closed')),
  created_at timestamptz not null default now()
);
create table if not exists public.patch_order_items (
  id bigint generated by default as identity primary key,
  order_id text not null references public.patch_orders(id) on delete cascade,
  patch_id text not null references public.patches(id) on delete restrict,
  patch_name text not null,
  quantity integer not null check (quantity > 0),
  unit_price integer not null default 0,
  line_total integer not null default 0
);
create index if not exists patch_orders_created_at_idx on public.patch_orders(created_at desc);
alter table public.patch_orders enable row level security;
alter table public.patch_order_items enable row level security;
