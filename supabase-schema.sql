-- Supabase schema for G care

-- Bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  services TEXT[],
  amount INTEGER,
  date DATE,
  time TEXT,
  address TEXT,
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  email TEXT NOT NULL,
  amount INTEGER,
  description TEXT,
  payment_method TEXT NOT NULL DEFAULT 'online' CHECK (payment_method IN ('online', 'cash_on_service', 'cod')),
  payment_status TEXT NOT NULL DEFAULT 'pending',
  razorpay_payment_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure old tables gain the new payment fields for Cash on Service support
ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS payment_method TEXT NOT NULL DEFAULT 'online',
  ADD COLUMN IF NOT EXISTS payment_status TEXT NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS razorpay_payment_id TEXT;

ALTER TABLE payments
  ADD CONSTRAINT IF NOT EXISTS payments_payment_method_check CHECK (payment_method IN ('online', 'cash_on_service', 'cod'));

-- Example policy for authenticated users to insert their own bookings
-- Enable RLS first, then apply this policy
-- ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Allow users to insert their own bookings" ON bookings
--   FOR INSERT USING (auth.uid() = user_id);

-- Enable row-level security for payments and allow each user to insert their own payment records.
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow users to insert their own payments" ON payments
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Allow users to read their own payments" ON payments
  FOR SELECT USING (auth.uid() = user_id);

-- If you also want a policy for updating payment status or other fields, add it here.
-- CREATE POLICY "Allow users to update their own payments" ON payments
--   FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
