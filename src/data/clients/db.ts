import type { NodePgDatabase } from 'drizzle-orm/node-postgres'

import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'

import env from '@/env'
import { logger as appLogger } from '@/logging'

import * as schema from '../schema'

export type Database = NodePgDatabase<typeof schema>

const pool = new Pool({
  connectionString: env.POSTGRES_URL,
  max: env.POSTGRES_MAX_CONNECTIONS,
})

export const db: Database = drizzle(pool, {
  schema,
  casing: 'snake_case',
  logger: env.POSTGRES_DEBUG && {
    logQuery(query, params) {
      appLogger.debug({ params, query }, 'SQL')
    },
  },
})

/**
 * Helper function to ping database at startup and verify connection
 */
export const verifyDbConnection = async (): Promise<void> => {
  try {
    const client = await pool.connect()
    appLogger.info({
      database: env.POSTGRES_DB,
      max: env.POSTGRES_MAX_CONNECTIONS,
    }, '🗄️  PostgreSQL connection established')
    client.release()
  } catch (err: unknown) {
    const error = err as { code?: string }
    appLogger.error({
      code: error.code,
      host: env.POSTGRES_HOST,
      port: env.POSTGRES_PORT,
    }, '🗄️  PostgreSQL connection failed')

    throw err
  }
}
