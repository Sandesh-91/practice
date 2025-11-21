CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,         -- hashed password (bcrypt)
    username VARCHAR(255) NOT NULL,
    city VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);


-- profiles table: maps to auth.users.id
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  city text,
  latitude double precision,
  longitude double precision,
  created_at timestamptz default now()
);

create table if not exists books (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  seller_id uuid references profiles(id),
  price numeric,
  condition text,
  description text,
  city text,
  latitude double precision,
  longitude double precision,
  image_url text,
  type text,   -- SELL / DONATE / BUY
  status text default 'AVAILABLE',
  contact_info text,
  created_at timestamptz default now()
);

create table if not exists purchase_requests (
  id uuid primary key default gen_random_uuid(),
  book_id uuid references books(id) on delete cascade,
  buyer_id uuid references profiles(id) on delete cascade,
  seller_id uuid references profiles(id) on delete cascade,
  status text default 'PENDING', -- PENDING/CONFIRMED/CANCELLED
  created_at timestamptz default now()
);

create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  title text,
  body text,
  read boolean default false,
  created_at timestamptz default now()
);
