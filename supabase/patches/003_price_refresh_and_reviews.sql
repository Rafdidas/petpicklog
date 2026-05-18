grant select, update on public.external_products to authenticated;
grant select, insert on public.product_reviews to authenticated;

drop policy if exists "external products are updatable by signed in users" on public.external_products;
create policy "external products are updatable by signed in users"
  on public.external_products for update
  to authenticated
  using (auth.uid() is not null)
  with check (auth.uid() is not null);

drop policy if exists "reviews are writable by owner" on public.product_reviews;
create policy "reviews are writable by owner"
  on public.product_reviews for insert
  to authenticated
  with check (auth.uid() = user_id);
