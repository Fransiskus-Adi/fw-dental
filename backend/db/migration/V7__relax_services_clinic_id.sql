-- Alter public.services table to relax the clinic_id NOT NULL constraint
ALTER TABLE public.services ALTER COLUMN clinic_id DROP NOT NULL;
