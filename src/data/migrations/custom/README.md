# Custom Migrations

Custom SQL migrations that extend Drizzle ORM's auto-generated migrations.

## Search Implementation

**Current Approach:** ILIKE with GIN index (`gin_trgm_ops`)

- Uses `pg_trgm` extension for fast substring matching
- Migration: `0001_search_indexes.sql`
- Query uses concatenated expression to leverage the GIN index (~5x faster than separate ILIKE per column)

### Index-Query Coupling

The query expression must exactly match the index expression:

- Index: see `0001_search_indexes.sql`
- Query: `src/data/repositories/user/queries.ts` (search function)
- To add a searchable column, update both the migration AND the query

### Capabilities

- Substring matching: `%john%` finds "Johnathan", "johnson@example.com"
- Case-insensitive search
- Good performance up to ~100k users

### Limitations

- No typo tolerance ("jonh" won't find "john")
- No relevance ranking (results ordered by `createdAt`, not match quality)

### Future Upgrade Path

ParadeDB for BM25 ranking, fuzzy search, and better scalability
