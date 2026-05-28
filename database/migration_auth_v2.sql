-- Migration: Google OAuth + WebAuthn
ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id TEXT UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS google_picture TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_provider TEXT NOT NULL DEFAULT 'email';
ALTER TABLE users ALTER COLUMN password DROP NOT NULL;

CREATE TABLE IF NOT EXISTS webauthn_credentials (id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE, credential_id TEXT NOT NULL UNIQUE, public_key TEXT NOT NULL, sign_count BIGINT NOT NULL DEFAULT 0, device_name TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), last_used_at TIMESTAMPTZ);

CREATE TABLE IF NOT EXISTS webauthn_challenges (id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), challenge TEXT NOT NULL UNIQUE, user_id UUID REFERENCES users(id), type TEXT NOT NULL DEFAULT 'registration', expires_at TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '5 minutes', used BOOLEAN NOT NULL DEFAULT false);