-- Development administrator and matching staff profile.
INSERT INTO auth.roles (code, name, description, permissions)
VALUES ('ADMIN', 'Administrator', 'System Administrator with full access',
        '{
  "page_dashboard": true,
  "feat_dashboard_metrics": true,
  "feat_dashboard_appointments": true,
  "page_absence": true,
  "feat_absence_history": true,
  "feat_absence_clock_in": true,
  "feat_absence_clock_out": true,
  "feat_absence_employee_logs": true,
  "page_bookings": true,
  "feat_bookings_create": true,
  "feat_bookings_status": true,
  "page_transactions": true,
  "feat_transactions_create": true,
  "feat_transactions_status": true,
  "feat_transactions_delete": true,
  "page_schedules": true,
  "feat_schedules_cancel": true,
  "page_employees": true,
  "feat_employees_write": true,
  "feat_employees_delete": true,
  "page_doctors": true,
  "feat_doctors_write": true,
  "feat_doctors_delete": true,
  "page_services": true,
  "feat_services_write": true,
  "feat_services_delete": true,
  "page_roles": true,
  "feat_roles_write": true,
  "feat_roles_delete": true,
  "page_settings": true,
  "feat_settings_write": true,
  "feat_notifications_view": true
}'::jsonb)
ON CONFLICT (code) DO NOTHING;

INSERT INTO auth.users (id, email, full_name, enabled)
VALUES ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'admin@fwdental.com', 'Administrator', 0)
ON CONFLICT (email) DO NOTHING;

INSERT INTO auth.user_roles (user_id, role_code)
SELECT id, 'ADMIN' FROM auth.users WHERE email = 'admin@fwdental.com'
ON CONFLICT DO NOTHING;

INSERT INTO public.employees (id, name, email, phone, role_code)
SELECT id, full_name, email, phone_number, 'ADMIN'
FROM auth.users WHERE email = 'admin@fwdental.com'
ON CONFLICT DO NOTHING;
