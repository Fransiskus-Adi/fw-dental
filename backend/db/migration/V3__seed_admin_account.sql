-- Seed Roles
INSERT INTO auth.roles (code, name, description, enabled, deleted)
VALUES ('ADMIN', 'Administrator', 'System Administrator with full access', 1, 0)
ON CONFLICT (code) DO NOTHING;

-- Seed Default Admin User
-- Password: password (bcrypt hash with 10 rounds)
INSERT INTO auth.users (id, email, password_hash, full_name, enabled, deleted)
VALUES ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'admin@fwdental.com', '$2b$10$Lrtyy/bx.LK7NpTYNuZ6tO5cVzuB059YTa/pVD5wFrFsfWM1JY/IG', 'Administrator', 1, 0)
ON CONFLICT (email) DO NOTHING;

-- Link User with Role
INSERT INTO auth.user_roles (user_id, role_code, enabled, deleted)
SELECT id, 'ADMIN', 1, 0
FROM auth.users
WHERE email = 'admin@fwdental.com'
ON CONFLICT (user_id, role_code) DO NOTHING;
