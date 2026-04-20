-- PropertyPro Database Schema
-- Run this once against your PostgreSQL database before loading data.

CREATE TABLE IF NOT EXISTS properties (
    property_id      SERIAL PRIMARY KEY,
    price            INTEGER,
    size             INTEGER,
    bedrooms         INTEGER,
    bathrooms        INTEGER,
    has_maid_room    BOOLEAN,
    description      TEXT,
    location         TEXT,
    city             VARCHAR(100),
    neighborhood     VARCHAR(255),
    type             VARCHAR(50),
    price_per_sqm    INTEGER,
    price_category   VARCHAR(20),
    bedroom_category VARCHAR(20),
    url              TEXT,
    created_at       TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
    id                SERIAL PRIMARY KEY,
    full_name         VARCHAR(255) NOT NULL,
    email             VARCHAR(255) UNIQUE NOT NULL,
    password_hash     VARCHAR(255),
    google_uid        VARCHAR(255) UNIQUE,
    is_email_verified BOOLEAN DEFAULT FALSE,
    preferences       JSONB DEFAULT '{}',
    created_at        TIMESTAMP DEFAULT NOW(),
    updated_at        TIMESTAMP DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TABLE IF NOT EXISTS user_sessions (
    id            SERIAL PRIMARY KEY,
    user_id       INTEGER REFERENCES users(id) ON DELETE CASCADE,
    refresh_token VARCHAR(512) NOT NULL,
    expires_at    TIMESTAMP NOT NULL,
    created_at    TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS verification_codes (
    id         SERIAL PRIMARY KEY,
    user_id    INTEGER REFERENCES users(id) ON DELETE CASCADE,
    email      VARCHAR(255) NOT NULL,
    code       VARCHAR(6) NOT NULL,
    type       VARCHAR(20) NOT NULL,
    used       BOOLEAN DEFAULT FALSE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_favorites (
    id          SERIAL PRIMARY KEY,
    user_id     INTEGER REFERENCES users(id) ON DELETE CASCADE,
    property_id INTEGER REFERENCES properties(property_id) ON DELETE CASCADE,
    saved_at    TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, property_id)
);
