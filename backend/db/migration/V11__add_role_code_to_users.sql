-- Alter public.users table to add role_code column
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS role_code VARCHAR(50);

-- Alter public.employees table to add role_code column
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS role_code VARCHAR(50);

-- Ensure ADMIN role has all permissions enabled
UPDATE auth.roles 
SET permissions = '{
  "page_dashboard": true,
  "feat_dashboard_metrics": true,
  "page_bookings": true,
  "feat_bookings_create": true,
  "feat_bookings_status": true,
  "page_transactions": true,
  "feat_transactions_create": true,
  "feat_transactions_status": true,
  "feat_transactions_delete": true,
  "page_schedules": true,
  "page_employees": true,
  "feat_employees_write": true,
  "feat_employees_delete": true,
  "page_doctors": true,
  "feat_doctors_write": true,
  "feat_doctors_delete": true,
  "page_roles": true,
  "feat_roles_write": true,
  "feat_roles_delete": true,
  "page_settings": true,
  "feat_settings_write": true
}'
WHERE code = 'ADMIN';

-- Insert admin user into public.users if not exists
INSERT INTO public.users (id, name, email, password, phone, role_code, created_at)
VALUES (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 
    'Administrator', 
    'admin@fwdental.com', 
    '$2b$10$Lrtyy/bx.LK7NpTYNuZ6tO5cVzuB059YTa/pVD5wFrFsfWM1JY/IG', 
    NULL, 
    'ADMIN', 
    NOW()
)
ON CONFLICT (email) DO UPDATE SET role_code = 'ADMIN';

-- Insert admin into public.employees if not exists
INSERT INTO public.employees (id, name, email, phone, role_code, created_at, updated_at)
VALUES (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 
    'Administrator', 
    'admin@fwdental.com', 
    NULL, 
    'ADMIN', 
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET role_code = 'ADMIN';
