grant select, insert on public.external_products to authenticated;
grant select, insert on public.price_histories to authenticated;
grant select, insert, update, delete on public.saved_products to authenticated;

drop policy if exists "external products are insertable by signed in users" on public.external_products;
create policy "external products are insertable by signed in users"
  on public.external_products for insert
  to authenticated
  with check (auth.uid() is not null);

drop policy if exists "price histories are insertable by signed in users" on public.price_histories;
create policy "price histories are insertable by signed in users"
  on public.price_histories for insert
  to authenticated
  with check (auth.uid() is not null);

drop policy if exists "saved products are owned by user" on public.saved_products;
create policy "saved products are owned by user"
  on public.saved_products for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
