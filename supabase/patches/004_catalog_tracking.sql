alter table public.external_products
  add column if not exists is_tracked boolean not null default false,
  add column if not exists category_slug text,
  add column if not exists pet_type text;

create index if not exists external_products_tracked_category_idx
  on public.external_products (is_tracked, category_slug);

alter table public.price_histories
  add column if not exists checked_date date not null default ((now() at time zone 'Asia/Seoul')::date);

create unique index if not exists price_histories_product_date_idx
  on public.price_histories (external_product_id, checked_date);

create or replace view public.product_price_stats
with (security_invoker = true) as
select
  ep.id as external_product_id,
  ep.title,
  ep.category_slug,
  ep.pet_type,
  ep.mall_name,
  ep.product_url,
  ep.image_url,
  latest.price as current_price,
  latest.checked_at as last_checked_at,
  coalesce(max14.max_price, latest.price) as max_price_14d,
  case
    when coalesce(max14.max_price, 0) > 0
      then round(((max14.max_price - latest.price)::numeric / max14.max_price) * 100)
    else 0
  end as drop_pct,
  coalesce(allmin.min_price, latest.price) as min_price_all
from public.external_products ep
join lateral (
  select price, checked_at
  from public.price_histories ph
  where ph.external_product_id = ep.id
  order by ph.checked_at desc
  limit 1
) latest on true
left join lateral (
  select max(price) as max_price
  from public.price_histories ph
  where ph.external_product_id = ep.id
    and ph.checked_at >= now() - interval '14 days'
) max14 on true
left join lateral (
  select min(price) as min_price
  from public.price_histories ph
  where ph.external_product_id = ep.id
) allmin on true
where ep.is_tracked = true;

grant select on public.product_price_stats to anon, authenticated;
