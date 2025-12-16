-- Migration: Add pg_trgm index for user search
-- This enables fast ILIKE searches on firstName, lastName, and email fields

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS idx_users_search_trgm ON users USING gin (
  (first_name || ' ' || COALESCE(last_name, '') || ' ' || email) gin_trgm_ops
);
