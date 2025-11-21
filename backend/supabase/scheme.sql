-- Profiles table (extends auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  city TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Books table
CREATE TABLE books (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  isbn TEXT,
  price DECIMAL(10, 2),
  condition TEXT CHECK (condition IN ('new', 'like_new', 'good', 'fair')),
  type TEXT CHECK (type IN ('sell', 'donate', 'rent')),
  description TEXT,
  owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'available' CHECK (status IN ('available', 'pending', 'sold', 'rented')),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  city TEXT,
  image_urls TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Rental requests table
CREATE TABLE rental_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  book_id UUID REFERENCES books(id) ON DELETE CASCADE,
  renter_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  start_date DATE,
  end_date DATE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'completed')),
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
ALTER TABLE rental_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Public profiles are viewable by everyone" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Books are viewable by everyone" ON books
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert books" ON books
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update own books" ON books
  FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Users can view their rental requests" ON rental_requests
  FOR SELECT USING (auth.uid() = renter_id OR auth.uid() IN (
    SELECT owner_id FROM books WHERE id = rental_requests.book_id
  ));

CREATE POLICY "Users can create rental requests" ON rental_requests
  FOR INSERT WITH CHECK (auth.uid() = renter_id);