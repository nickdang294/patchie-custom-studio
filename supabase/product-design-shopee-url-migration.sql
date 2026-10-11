-- Run once in Supabase SQL Editor to store a Shopee URL on each saved design.
alter table public.product_designs
  add column if not exists shopee_url text;
