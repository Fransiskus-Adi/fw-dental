-- Migration to add days column to public.doctors table
ALTER TABLE public.doctors ADD COLUMN IF NOT EXISTS days TEXT;
