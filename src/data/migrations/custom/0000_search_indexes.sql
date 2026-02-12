-- Migration: Add GIN trigram indexes for search

CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Users search index (id, firstName, lastName, email)
CREATE INDEX IF NOT EXISTS idx_users_search_trgm ON users USING gin (
  (id::text || ' ' || first_name || ' ' || COALESCE(last_name, '') || ' ' || email) gin_trgm_ops
);

-- Teams search index (id, name, website, description)
CREATE INDEX IF NOT EXISTS idx_teams_search_trgm ON teams USING gin (
  (id::text || ' ' || name || ' ' || COALESCE(website, '') || ' ' || COALESCE(description, '')) gin_trgm_ops
);
