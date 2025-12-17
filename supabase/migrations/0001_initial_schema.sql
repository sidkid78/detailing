
-- Set search path for the session
SET search_path = public, extensions;

-- Grant privileges to anon, authenticated, and service_role
-- Note: Do NOT revoke privileges from postgres role as it's needed for Supabase internal operations
REVOKE ALL ON SCHEMA public FROM anon, authenticated, service_role;
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- Grant select, insert, update, delete to anon and authenticated users on all tables in the public schema
-- These will be further restricted by RLS policies
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;

-- Custom Types
CREATE TYPE public.user_role AS ENUM ('customer', 'detailer', 'admin');
CREATE TYPE public.booking_status AS ENUM ('pending', 'confirmed', 'completed', 'cancelled');

-- Tables

-- profiles
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    full_name TEXT,
    phone_number TEXT,
    role public.user_role DEFAULT 'customer' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX ON public.profiles (role);

-- detailers
CREATE TABLE public.detailers (
    id UUID REFERENCES public.profiles ON DELETE CASCADE PRIMARY KEY,
    business_name TEXT,
    service_area_description TEXT,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX ON public.detailers (is_active);

-- services
CREATE TABLE public.services (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    price NUMERIC NOT NULL,
    estimated_duration_minutes INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX ON public.services (is_active);

-- bookings
CREATE TABLE public.bookings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id UUID REFERENCES public.profiles ON DELETE CASCADE NOT NULL,
    detailer_id UUID REFERENCES public.detailers ON DELETE SET NULL,
    service_id UUID REFERENCES public.services ON DELETE SET NULL NOT NULL,
    booking_time TIMESTAMPTZ NOT NULL,
    location_address TEXT NOT NULL,
    status public.booking_status DEFAULT 'pending' NOT NULL,
    final_price NUMERIC,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX ON public.bookings (customer_id);
CREATE INDEX ON public.bookings (detailer_id);
CREATE INDEX ON public.bookings (service_id);
CREATE INDEX ON public.bookings (status);
CREATE INDEX ON public.bookings (booking_time);

-- detailer_availability
-- Note: Removed overly restrictive UNIQUE constraint to allow multiple time slots per day
CREATE TABLE public.detailer_availability (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    detailer_id UUID REFERENCES public.detailers ON DELETE CASCADE NOT NULL,
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CHECK (start_time < end_time)
);
CREATE INDEX ON public.detailer_availability (detailer_id);
CREATE INDEX ON public.detailer_availability (day_of_week);

-- Triggers

-- Function to set updated_at column
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_profiles BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_updated_at_detailers BEFORE UPDATE ON public.detailers FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_updated_at_services BEFORE UPDATE ON public.services FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_updated_at_bookings BEFORE UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_updated_at_detailer_availability BEFORE UPDATE ON public.detailer_availability FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- Function to create a new profile entry for new auth.users()
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone_number)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'phone_number');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call handle_new_user() when a new user is inserted into auth.users
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS Setup

-- Helper function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS public.user_role AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE;

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.detailers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.detailer_availability ENABLE ROW LEVEL SECURITY;

-- Policies for profiles table
-- Admins can manage all profiles
CREATE POLICY "Admins can manage all profiles" ON public.profiles
FOR ALL USING ( (SELECT public.get_user_role()) = 'admin' ) WITH CHECK ( (SELECT public.get_user_role()) = 'admin' );

-- All authenticated users can read profiles (basic info)
CREATE POLICY "Allow all authenticated users to read profiles" ON public.profiles
FOR SELECT USING ( TRUE );

-- Authenticated users can update their own profile
CREATE POLICY "Allow authenticated users to update their own profile" ON public.profiles
FOR UPDATE USING ( auth.uid() = id ) WITH CHECK ( auth.uid() = id );

-- Policies for detailers table
-- Admins can manage all detailers
CREATE POLICY "Admins can manage all detailers" ON public.detailers
FOR ALL USING ( (SELECT public.get_user_role()) = 'admin' ) WITH CHECK ( (SELECT public.get_user_role()) = 'admin' );

-- All authenticated users can read active detailers
CREATE POLICY "Allow authenticated users to read active detailers" ON public.detailers
FOR SELECT USING ( is_active = TRUE );

-- Detailers can read their own entry
CREATE POLICY "Allow detailers to read their own entry" ON public.detailers
FOR SELECT USING ( auth.uid() = id AND (SELECT public.get_user_role()) = 'detailer' );

-- Detailers can update their own detailer profile
CREATE POLICY "Detailers can update their own detailer profile" ON public.detailers
FOR UPDATE USING ( auth.uid() = id AND (SELECT public.get_user_role()) = 'detailer' )
WITH CHECK ( auth.uid() = id AND (SELECT public.get_user_role()) = 'detailer' );

-- Policies for services table
-- Admins can manage all services
CREATE POLICY "Admins can manage all services" ON public.services
FOR ALL USING ( (SELECT public.get_user_role()) = 'admin' ) WITH CHECK ( (SELECT public.get_user_role()) = 'admin' );

-- All authenticated users can read active services
CREATE POLICY "Allow all authenticated users to read active services" ON public.services
FOR SELECT USING ( is_active = TRUE );


-- Policies for bookings table
-- Admins can manage all bookings
CREATE POLICY "Admins can manage all bookings" ON public.bookings
FOR ALL USING ( (SELECT public.get_user_role()) = 'admin' ) WITH CHECK ( (SELECT public.get_user_role()) = 'admin' );

-- Customers can view their own bookings
CREATE POLICY "Customers can view their own bookings" ON public.bookings
FOR SELECT USING ( auth.uid() = customer_id AND (SELECT public.get_user_role()) = 'customer' );

-- Detailers can view their assigned bookings
CREATE POLICY "Detailers can view their assigned bookings" ON public.bookings
FOR SELECT USING ( auth.uid() = detailer_id AND (SELECT public.get_user_role()) = 'detailer' );

-- Customers can create their own bookings
CREATE POLICY "Customers can create their own bookings" ON public.bookings
FOR INSERT WITH CHECK ( auth.uid() = customer_id AND (SELECT public.get_user_role()) = 'customer' );

-- Customers can update their own bookings (e.g., reschedule, cancel)
CREATE POLICY "Customers can update their own bookings" ON public.bookings
FOR UPDATE USING ( auth.uid() = customer_id AND (SELECT public.get_user_role()) = 'customer' )
WITH CHECK ( auth.uid() = customer_id AND (SELECT public.get_user_role()) = 'customer' );

-- Detailers can update their assigned bookings (e.g., status, final_price)
CREATE POLICY "Detailers can update their assigned bookings" ON public.bookings
FOR UPDATE USING ( auth.uid() = detailer_id AND (SELECT public.get_user_role()) = 'detailer' )
WITH CHECK ( auth.uid() = detailer_id AND (SELECT public.get_user_role()) = 'detailer' );

-- Customers can delete their own bookings (e.g., cancel before confirmation)
CREATE POLICY "Customers can delete their own bookings" ON public.bookings
FOR DELETE USING ( auth.uid() = customer_id AND (SELECT public.get_user_role()) = 'customer' );

-- Policies for detailer_availability table
-- Admins can manage all availability
CREATE POLICY "Admins can manage all availability" ON public.detailer_availability
FOR ALL USING ( (SELECT public.get_user_role()) = 'admin' ) WITH CHECK ( (SELECT public.get_user_role()) = 'admin' );

-- Allow customers to read active detailers availability
CREATE POLICY "Allow customers to read active detailers availability" ON public.detailer_availability
FOR SELECT USING ( detailer_id IN (SELECT id FROM public.detailers WHERE is_active = TRUE) );

-- Detailers can view their own availability
CREATE POLICY "Detailers can view their own availability" ON public.detailer_availability
FOR SELECT USING ( auth.uid() = detailer_id AND (SELECT public.get_user_role()) = 'detailer' );

-- Detailers can insert their own availability
CREATE POLICY "Detailers can insert their own availability" ON public.detailer_availability
FOR INSERT WITH CHECK ( auth.uid() = detailer_id AND (SELECT public.get_user_role()) = 'detailer' );

-- Detailers can update their own availability
CREATE POLICY "Detailers can update their own availability" ON public.detailer_availability
FOR UPDATE USING ( auth.uid() = detailer_id AND (SELECT public.get_user_role()) = 'detailer' )
WITH CHECK ( auth.uid() = detailer_id AND (SELECT public.get_user_role()) = 'detailer' );

-- Detailers can delete their own availability
CREATE POLICY "Detailers can delete their own availability" ON public.detailer_availability
FOR DELETE USING ( auth.uid() = detailer_id AND (SELECT public.get_user_role()) = 'detailer' );
