import type { NodePgDatabase } from 'drizzle-orm/node-postgres'

import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'

import env, { isDevEnv } from '@/env'

import * as schema from '../schema'

export type Database = NodePgDatabase<typeof schema>

const pool = new Pool({
  connectionString: env.POSTGRES_URL,
  max: env.POSTGRES_MAX_CONNECTIONS,
})

export const db: Database = drizzle(pool, {
  schema,
  casing: 'snake_case',
  logger: isDevEnv(),
})
