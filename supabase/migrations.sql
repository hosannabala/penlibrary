-- ─── Run these in Supabase SQL Editor to apply schema changes ────────────────
-- These are incremental changes on top of the original schema.sql

-- 1. Add shipping columns to orders
alter table orders
  add column if not exists shipping_fee  numeric(12,2) default 0,
  add column if not exists courier_name  text;

-- Make payment_reference unique to prevent duplicate order creation
alter table orders
  drop constraint if exists orders_payment_reference_key;
alter table orders
  add constraint orders_payment_reference_key unique (payment_reference);

-- 2. Add missing columns to club_meetings
alter table club_meetings
  add column if not exists time       text,
  add column if not exists book_title text;

-- 3. Add unique constraint to club_members.email (for upsert)
alter table club_members
  drop constraint if exists club_members_email_key;
alter table club_members
  add constraint club_members_email_key unique (email);

-- 4. Replace decrement_stock with race-condition-safe version
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

-- 5. Performance indexes
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
