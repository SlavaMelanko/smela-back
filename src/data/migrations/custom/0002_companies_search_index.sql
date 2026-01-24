-- Migration: Add GIN trigram index for company search
-- Enables fast ILIKE searches on name, website, and description fields

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS idx_companies_search_trgm ON companies USING gin (
  (name || ' ' || COALESCE(website, '') || ' ' || COALESCE(description, '')) gin_trgm_ops
);
