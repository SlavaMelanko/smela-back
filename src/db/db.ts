import { Pool } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-serverless'

import env, { isDevEnv } from '@/lib/env'

import * as schema from './schema'

const pool = new Pool({
  connectionString: env.DB_URL,
  max: env.DB_MAX_CONNECTIONS,
})

const db = drizzle(pool, {
  schema,
  logger: isDevEnv(),
})

export default db
