import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

import { sql } from 'drizzle-orm'

import { db } from '../../clients'

const MIGRATIONS_DIR = import.meta.dir
const TRACKING_TABLE = '__custom_migrations'

const ensureTrackingTable = async () => {
  await db.execute(sql.raw(`
    CREATE TABLE IF NOT EXISTS ${TRACKING_TABLE} (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE,
      applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `))
}

const getAppliedMigrations = async (): Promise<Set<string>> => {
  const result = await db.execute(sql.raw(`SELECT name FROM ${TRACKING_TABLE}`))
  return new Set(result.rows.map(row => (row as { name: string }).name))
}

const markAsApplied = async (name: string) => {
  await db.execute(sql.raw(`INSERT INTO ${TRACKING_TABLE} (name) VALUES ('${name}')`))
}

export const runCustomMigrations = async () => {
  console.log('Running custom migrations...')

  await ensureTrackingTable()
  const applied = await getAppliedMigrations()

  const files = readdirSync(MIGRATIONS_DIR)
    .filter(f => f.endsWith('.sql'))
    .sort()

  let count = 0

  for (const file of files) {
    if (applied.has(file)) {
      console.log(`  ⏭️  ${file} (already applied)`)
      continue
    }

    const content = readFileSync(join(MIGRATIONS_DIR, file), 'utf-8')
    console.log(`  ▶️  Applying ${file}...`)

    await db.execute(sql.raw(content))
    await markAsApplied(file)

    console.log(`  ✅ ${file} applied`)
    count++
  }

  if (count === 0) {
    console.log('No new custom migrations to apply')
  }
  else {
    console.log(`Applied ${count} custom migration(s)`)
  }
}

// Run if executed directly
if (import.meta.main) {
  runCustomMigrations()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Custom migration failed:', err)
      process.exit(1)
    })
}
