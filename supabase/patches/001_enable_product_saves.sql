create unique index if not exists saved_products_user_external_product_idx
  on public.saved_products (user_id, external_product_id)
  where external_product_id is not null;

create unique index if not exists saved_products_user_product_idx
  on public.saved_products (user_id, product_id)
  where product_id is not null;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'external_products'
      and policyname = 'external products are insertable by signed in users'
  ) then
    create policy "external products are insertable by signed in users"
      on public.external_products for insert
      to authenticated
      with check (true);
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'price_histories'
      and policyname = 'price histories are insertable by signed in users'
  ) then
    create policy "price histories are insertable by signed in users"
      on public.price_histories for insert
      to authenticated
      with check (true);
  end if;
end
$$;
