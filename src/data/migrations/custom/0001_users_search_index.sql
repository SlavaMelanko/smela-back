-- Migration: Add pg_trgm index for user search
-- Enables fast ILIKE searches on firstName, lastName, email, and id (UUID) fields

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS idx_users_search_trgm ON users USING gin (
  (first_name || ' ' || COALESCE(last_name, '') || ' ' || email || ' ' || id::text) gin_trgm_ops
);
