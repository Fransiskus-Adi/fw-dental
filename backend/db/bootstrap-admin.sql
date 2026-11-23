\set ON_ERROR_STOP on
\if :{?admin_email}
\else
\prompt 'Administrator email: ' admin_email
\endif

SELECT :'admin_email' ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
       AND length(:'admin_email') <= 255 AS valid_email \gset
\if :valid_email
\else
  DO $$ BEGIN RAISE EXCEPTION 'Provide a valid administrator email.'; END $$;
\endif

BEGIN;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM auth.roles WHERE code = 'ADMIN' AND enabled = 1 AND deleted = 0
    ) THEN
        RAISE EXCEPTION 'Apply migrations and enable the ADMIN role before bootstrapping.';
    END IF;
END
$$;

WITH account AS (
    INSERT INTO auth.users (email, full_name)
    VALUES (:'admin_email', 'Administrator') RETURNING id, email, full_name
), membership AS (
    INSERT INTO auth.user_roles (user_id, role_code)
    SELECT id, 'ADMIN' FROM account
)
INSERT INTO public.employees (id, name, email, role_code)
SELECT id, full_name, email, 'ADMIN' FROM account;

COMMIT;
