-- Migration: Add GIN trigram indexes for search
-- Enables fast ILIKE searches on users and companies tables

CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Users search index (id, firstName, lastName, email)
CREATE INDEX IF NOT EXISTS idx_users_search_trgm ON users USING gin (
  (id::text || ' ' || first_name || ' ' || COALESCE(last_name, '') || ' ' || email) gin_trgm_ops
);

-- Companies search index (id, name, website, description)
CREATE INDEX IF NOT EXISTS idx_companies_search_trgm ON companies USING gin (
  (id::text || ' ' || name || ' ' || COALESCE(website, '') || ' ' || COALESCE(description, '')) gin_trgm_ops
);
