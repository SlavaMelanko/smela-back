import type { NeonDatabase } from 'drizzle-orm/neon-serverless'

import { Pool } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-serverless'

import env, { isDevEnv } from '@/lib/env'

import * as schema from '../schema'

export type Transaction = NeonDatabase<typeof schema>

const pool = new Pool({
  connectionString: env.DB_URL,
  max: env.DB_MAX_CONNECTIONS,
})

const db = drizzle(pool, {
  schema,
  logger: isDevEnv(),
})

export default db
