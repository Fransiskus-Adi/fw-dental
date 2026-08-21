-- Create public.employees table
CREATE TABLE IF NOT EXISTS public.employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(30),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index on email
CREATE INDEX IF NOT EXISTS idx_employees_email ON public.employees(email);

-- Migrate existing users to employees table
INSERT INTO public.employees (id, name, email, phone, created_at, updated_at)
SELECT id, name, email, phone, created_at, created_at
FROM public.users u
WHERE NOT EXISTS (
    SELECT 1 FROM public.employees e 
    WHERE e.email = u.email OR e.id = u.id
);

-- Seed existing doctors into users table
INSERT INTO public.users (id, name, email, phone, password, created_at)
SELECT id, name, email, phone, '$2b$10$Lrtyy/bx.LK7NpTYNuZ6tO5cVzuB059YTa/pVD5wFrFsfWM1JY/IG', created_at -- 'password'
FROM public.doctors d
WHERE d.email IS NOT NULL AND d.email != ''
  AND NOT EXISTS (
      SELECT 1 FROM public.users u 
      WHERE u.email = d.email OR u.id = d.id
  );
