-- ─── Pen Library Services — Supabase Schema ──────────────────────────────────
-- Run this in: Supabase Dashboard → SQL Editor → New Query → Run

-- Enable UUID generation
create extension if not exists "pgcrypto";

-- ─── Books ───────────────────────────────────────────────────────────────────
create table if not exists books (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  author       text not null,
  price        numeric(12,2) not null,
  sale_price   numeric(12,2),
  cost_price   numeric(12,2),
  category     text not null default '',
  cover_url    text,
  description  text,
  featured     boolean not null default false,
  stock        integer not null default 0,
  pre_order    boolean not null default false,
  best_seller  boolean not null default false,
  created_at   timestamptz not null default now()
);

-- ─── Categories ──────────────────────────────────────────────────────────────
create table if not exists categories (
  id    uuid primary key default gen_random_uuid(),
  name  text not null,
  slug  text not null unique
);

-- ─── Orders ──────────────────────────────────────────────────────────────────
create table if not exists orders (
  id                 uuid primary key default gen_random_uuid(),
  user_id            text,
  items              jsonb not null default '[]',
  total              numeric(12,2) not null,
  status             text not null default 'pending',
  payment_reference  text unique,
  payment_status     text default 'pending',
  amount_paid        numeric(12,2),
  customer_name      text,
  customer_email     text,
  customer_phone     text,
  delivery_method    text,
  address            text,
  shipping_fee       numeric(12,2) default 0,
  courier_name       text,
  created_at         timestamptz not null default now()
);

-- ─── User Profiles ───────────────────────────────────────────────────────────
create table if not exists user_profiles (
  uid          text primary key,
  email        text not null,
  display_name text,
  photo_url    text,
  xp           integer not null default 0,
  level        text not null default 'Bronze',
  streak       integer not null default 0,
  badges       text[] not null default '{}',
  wishlist     text[] not null default '{}',
  created_at   timestamptz not null default now()
);

-- ─── Club Meetings ───────────────────────────────────────────────────────────
create table if not exists club_meetings (
  id            uuid primary key default gen_random_uuid(),
  title         text not null,
  date          text not null,
  time          text,
  type          text not null default 'discussion',
  description   text,
  book_id       text,
  book_title    text,
  meeting_link  text,
  location      text,
  created_at    timestamptz not null default now()
);

-- ─── Club Members ────────────────────────────────────────────────────────────
create table if not exists club_members (
  id         uuid primary key default gen_random_uuid(),
  email      text not null unique,
  uid        text,
  joined_at  timestamptz not null default now()
);

-- ─── Club RSVPs ──────────────────────────────────────────────────────────────
create table if not exists club_rsvps (
  id          uuid primary key default gen_random_uuid(),
  meeting_id  text not null,
  uid         text not null,
  email       text,
  created_at  timestamptz not null default now(),
  unique (meeting_id, uid)
);

-- ─── Book Requests ───────────────────────────────────────────────────────────
create table if not exists book_requests (
  id          uuid primary key default gen_random_uuid(),
  user_id     text not null,
  user_name   text not null,
  book_title  text not null,
  author      text not null,
  status      text not null default 'pending',
  created_at  timestamptz not null default now()
);

-- ─── Gallery ─────────────────────────────────────────────────────────────────
create table if not exists gallery (
  id          uuid primary key default gen_random_uuid(),
  url         text not null,
  title       text,
  created_at  timestamptz not null default now()
);

-- ─── Consultations ───────────────────────────────────────────────────────────
create table if not exists consultations (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  email       text not null,
  topic       text not null,
  notes       text,
  status      text not null default 'requested',
  created_at  timestamptz not null default now()
);

-- ─── Admins ──────────────────────────────────────────────────────────────────
create table if not exists admins (
  uid    text primary key,
  email  text not null
);

-- ─── Helper function: decrement stock with oversell protection ───────────────
-- Returns TRUE if decremented successfully, FALSE if insufficient stock.
-- Uses FOR UPDATE to prevent race conditions on simultaneous purchases.
create or replace function decrement_stock(book_id uuid, qty integer)
returns boolean language plpgsql as $$
declare
  current_stock integer;
begin
  select stock into current_stock from books where id = book_id for update;
  if current_stock is null or current_stock < qty then
    return false;
  end if;
  update books set stock = stock - qty where id = book_id;
  return true;
end;
$$;

-- ─── Indexes ──────────────────────────────────────────────────────────────────
create index if not exists idx_orders_payment_reference  on orders (payment_reference);
create index if not exists idx_orders_user_id            on orders (user_id);
create index if not exists idx_orders_customer_email     on orders (customer_email);
create index if not exists idx_orders_created_at         on orders (created_at desc);
create index if not exists idx_books_category            on books (category);
create index if not exists idx_books_featured            on books (featured) where featured = true;
create index if not exists idx_books_best_seller         on books (best_seller) where best_seller = true;
create index if not exists idx_books_created_at          on books (created_at desc);
create index if not exists idx_book_requests_user_id     on book_requests (user_id);
create index if not exists idx_club_members_email        on club_members (email);

-- Seed default admin
insert into admins (uid, email) values
  ('admin', 'hosannabala4u@gmail.com')
on conflict (uid) do nothing;

-- ─── Grants (must run before RLS — PostgreSQL checks GRANT before policies) ───
grant all on all tables    in schema public to service_role;
grant all on all sequences in schema public to service_role;
grant execute on all functions in schema public to service_role;

grant select on public.books         to anon;
grant select on public.categories    to anon;
grant select on public.club_meetings to anon;
grant select on public.gallery       to anon;

grant select, insert, update on public.user_profiles  to authenticated;
grant select, insert         on public.orders          to authenticated;
grant select, insert         on public.book_requests   to authenticated;
grant select, insert         on public.club_members    to authenticated;
grant select, insert         on public.club_rsvps      to authenticated;

-- ─── Row Level Security ───────────────────────────────────────────────────────
alter table books         enable row level security;
alter table categories    enable row level security;
alter table orders        enable row level security;
alter table user_profiles enable row level security;
alter table club_meetings enable row level security;
alter table club_members  enable row level security;
alter table club_rsvps    enable row level security;
alter table book_requests enable row level security;
alter table gallery       enable row level security;
alter table consultations enable row level security;
alter table admins        enable row level security;

-- Public read on books, categories, club_meetings, gallery
create policy "public read books"         on books         for select using (true);
create policy "public read categories"    on categories    for select using (true);
create policy "public read club_meetings" on club_meetings for select using (true);
create policy "public read gallery"       on gallery       for select using (true);

-- Full access via service role (API routes bypass RLS automatically with service key)
-- All writes go through API routes or admin dashboard using service key

-- Users can read/write their own profile
create policy "users own profile" on user_profiles
  for all using (auth.uid()::text = uid);

-- Users can read their own orders
create policy "users own orders" on orders
  for select using (auth.uid()::text = user_id);

-- Users can read their own requests
create policy "users own requests" on book_requests
  for select using (auth.uid()::text = user_id);
