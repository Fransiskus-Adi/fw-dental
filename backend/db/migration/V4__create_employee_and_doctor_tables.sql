-- Create public.users table if it doesn't exist (used for employees)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255),
    phone VARCHAR(30),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Alter public.doctors table to add missing fields and relax clinic_id constraint
ALTER TABLE public.doctors ALTER COLUMN clinic_id DROP NOT NULL;

-- Add columns if they do not exist
ALTER TABLE public.doctors ADD COLUMN IF NOT EXISTS email VARCHAR(255);
ALTER TABLE public.doctors ADD COLUMN IF NOT EXISTS phone VARCHAR(30);
ALTER TABLE public.doctors ADD COLUMN IF NOT EXISTS shift_start VARCHAR(10) DEFAULT '09:00';
ALTER TABLE public.doctors ADD COLUMN IF NOT EXISTS shift_end VARCHAR(10) DEFAULT '17:00';
ALTER TABLE public.doctors ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'Active';
ALTER TABLE public.doctors ADD COLUMN IF NOT EXISTS appointments_count INTEGER DEFAULT 0;
ALTER TABLE public.doctors ADD COLUMN IF NOT EXISTS rating NUMERIC(3,1) DEFAULT 5.0;
