CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE SCHEMA IF NOT EXISTS auth;

-- =========================================================
-- AUTH SCHEMA
-- =========================================================

CREATE TABLE auth.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,

    full_name VARCHAR(150) NOT NULL,
    phone_number VARCHAR(30),

    enabled SMALLINT NOT NULL DEFAULT 1,
    deleted SMALLINT NOT NULL DEFAULT 0,

    last_login_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID,

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by UUID
);


CREATE TABLE auth.roles (
    code VARCHAR(50) PRIMARY KEY,

    name VARCHAR(100) NOT NULL,
    description TEXT,

    enabled SMALLINT NOT NULL DEFAULT 1,
    deleted SMALLINT NOT NULL DEFAULT 0,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID,

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by UUID
);


CREATE TABLE auth.authorities (
    code VARCHAR(100) PRIMARY KEY,

    name VARCHAR(150) NOT NULL,
    description TEXT,

    enabled SMALLINT NOT NULL DEFAULT 1,
    deleted SMALLINT NOT NULL DEFAULT 0,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID,

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by UUID
);


CREATE TABLE auth.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL,
    role_code VARCHAR(50) NOT NULL,

    enabled SMALLINT NOT NULL DEFAULT 1,
    deleted SMALLINT NOT NULL DEFAULT 0,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID,

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by UUID,

    UNIQUE (user_id, role_code)
);


CREATE TABLE auth.role_authorities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    role_code VARCHAR(50) NOT NULL,
    authority_code VARCHAR(100) NOT NULL,

    enabled SMALLINT NOT NULL DEFAULT 1,
    deleted SMALLINT NOT NULL DEFAULT 0,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID,

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by UUID,

    UNIQUE (role_code, authority_code)
);


CREATE TABLE auth.refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL,

    token_hash TEXT NOT NULL,

    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ,

    enabled SMALLINT NOT NULL DEFAULT 1,
    deleted SMALLINT NOT NULL DEFAULT 0,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


CREATE TABLE auth.login_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID,

    email VARCHAR(255),

    status_code VARCHAR(30) NOT NULL,

    ip_address VARCHAR(100),
    user_agent TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- =========================================================
-- INDEXES
-- =========================================================

CREATE INDEX idx_users_email
    ON auth.users(email);

CREATE INDEX idx_user_roles_user
    ON auth.user_roles(user_id);

CREATE INDEX idx_user_roles_role
    ON auth.user_roles(role_code);

CREATE INDEX idx_role_authorities_role
    ON auth.role_authorities(role_code);

CREATE INDEX idx_role_authorities_authority
    ON auth.role_authorities(authority_code);

CREATE INDEX idx_refresh_tokens_user
    ON auth.refresh_tokens(user_id);
