-- Create public.absences table
CREATE TABLE IF NOT EXISTS public.absences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    clock_in TIMESTAMPTZ,
    clock_out TIMESTAMPTZ,
    clock_in_location VARCHAR(255),
    clock_out_location VARCHAR(255),
    status VARCHAR(50) NOT NULL, -- 'PRESENT' or 'LATE'
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, date)
);

-- Index on user_id and date for fast lookups
CREATE INDEX IF NOT EXISTS idx_absences_user_date ON public.absences(user_id, date);
