-- Run this once in Supabase SQL Editor if Admin shows:
-- permission denied for table patch_orders

grant all on table public.patch_orders to service_role;
grant all on table public.patch_order_items to service_role;
grant usage, select on sequence public.patch_order_items_id_seq to service_role;
