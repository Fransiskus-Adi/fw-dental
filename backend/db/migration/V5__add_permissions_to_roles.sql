-- Alter auth.roles table to add permissions JSONB column
ALTER TABLE auth.roles ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '{}';
