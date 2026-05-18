create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nickname text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.external_products (
  id uuid primary key default gen_random_uuid(),
  source text not null,
  external_id text not null,
  title text not null,
  brand text,
  category text,
  image_url text,
  product_url text not null,
  mall_name text,
  latest_price integer,
  raw_data jsonb not null default '{}'::jsonb,
  first_seen_at timestamptz not null default now(),
  last_synced_at timestamptz not null default now(),
  unique (source, external_id)
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  brand text,
  category text,
  pet_type text not null default 'BOTH',
  product_type text not null default 'ETC',
  description text,
  ingredients_text text,
  nutrition_text text,
  image_url text,
  status text not null default 'DRAFT',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.price_histories (
  id uuid primary key default gen_random_uuid(),
  external_product_id uuid references public.external_products(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  source text not null,
  mall_name text,
  price integer not null,
  product_url text not null,
  checked_at timestamptz not null default now()
);

create table if not exists public.saved_products (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  external_product_id uuid references public.external_products(id) on delete cascade,
  product_id uuid references public.products(id) on delete cascade,
  status text not null default 'WISHLIST',
  memo text,
  saved_price integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (external_product_id is not null or product_id is not null)
);

create table if not exists public.product_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  external_product_id uuid references public.external_products(id) on delete set null,
  product_id uuid references public.products(id) on delete set null,
  rating integer not null check (rating between 1 and 5),
  repurchase_intent boolean,
  review_type text not null,
  content text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (external_product_id is not null or product_id is not null)
);

create table if not exists public.animal_hospitals (
  id uuid primary key default gen_random_uuid(),
  source_id text unique,
  name text not null,
  status text,
  phone text,
  road_address text,
  lot_address text,
  sido text,
  sigungu text,
  latitude numeric,
  longitude numeric,
  license_date date,
  raw_data jsonb not null default '{}'::jsonb,
  synced_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.external_products enable row level security;
alter table public.products enable row level security;
alter table public.price_histories enable row level security;
alter table public.saved_products enable row level security;
alter table public.product_reviews enable row level security;
alter table public.animal_hospitals enable row level security;

create unique index if not exists saved_products_user_external_product_idx
  on public.saved_products (user_id, external_product_id)
  where external_product_id is not null;

create unique index if not exists saved_products_user_product_idx
  on public.saved_products (user_id, product_id)
  where product_id is not null;

create policy "profiles are readable by owner"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles are writable by owner"
  on public.profiles for all
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "external products are readable"
  on public.external_products for select
  to anon, authenticated
  using (true);

create policy "external products are insertable by signed in users"
  on public.external_products for insert
  to authenticated
  with check (true);

create policy "products are readable"
  on public.products for select
  to anon, authenticated
  using (status = 'ACTIVE');

create policy "price histories are readable"
  on public.price_histories for select
  to anon, authenticated
  using (true);

create policy "price histories are insertable by signed in users"
  on public.price_histories for insert
  to authenticated
  with check (true);

create policy "saved products are owned by user"
  on public.saved_products for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "reviews are readable"
  on public.product_reviews for select
  to anon, authenticated
  using (true);

create policy "reviews are writable by owner"
  on public.product_reviews for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "animal hospitals are readable"
  on public.animal_hospitals for select
  to anon, authenticated
  using (true);
