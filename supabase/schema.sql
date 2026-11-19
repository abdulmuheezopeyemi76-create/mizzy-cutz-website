
-- MIZZY CUTZ DATABASE
-- Supabase SQL schema

create extension if not exists pgcrypto;

-- 1. Owner/admin accounts
create table if not exists public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- 2. Services
create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  price numeric(10,2),
  description text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- 3. Customer bookings
create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  phone text not null,
  service text not null,
  appointment_date date not null,
  appointment_time time not null,
  note text,
  status text not null default 'pending'
    check (status in ('pending', 'confirmed', 'cancelled', 'completed')),
  created_at timestamptz not null default now()
);

-- 4. Gallery photos
create table if not exists public.gallery (
  id uuid primary key default gen_random_uuid(),
  image_url text not null,
  caption text,
  created_at timestamptz not null default now()
);

-- Enable Row Level Security
alter table public.admins enable row level security;
alter table public.services enable row level security;
alter table public.bookings enable row level security;
alter table public.gallery enable row level security;

-- Admins can view their own admin record
create policy "Admins can view own record"
on public.admins for select
to authenticated
using (user_id = auth.uid());

-- Anyone can view active services
create policy "Public can view active services"
on public.services for select
to anon, authenticated
using (active = true);

-- Admins can manage services
create policy "Admins manage services"
on public.services for all
to authenticated
using (
  exists (
    select 1 from public.admins
    where user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.admins
    where user_id = auth.uid()
  )
);

-- Customers can submit bookings
create policy "Customers can create bookings"
on public.bookings for insert
to anon, authenticated
with check (status = 'pending');

-- Admins can manage bookings
create policy "Admins manage bookings"
on public.bookings for all
to authenticated
using (
  exists (
    select 1 from public.admins
    where user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.admins
    where user_id = auth.uid()
  )
);

-- Anyone can view gallery photos
create policy "Public can view gallery"
on public.gallery for select
to anon, authenticated
using (true);

-- Admins can manage gallery
create policy "Admins manage gallery"
on public.gallery for all
to authenticated
using (
  exists (
    select 1 from public.admins
    where user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.admins
    where user_id = auth.uid()
  )
);

-- Default MIZZY CUTZ services
insert into public.services (name, price) values
('Haircut', 2000),
('Haircut + Dye', 3000),
('Shape-up', 1000),
('Hair Tint', null),
('Dreadlocks', null),
('Hair Relaxer', null),
('Beard Trim', null),
('Hair Wash', null)
on conflict do nothing;
