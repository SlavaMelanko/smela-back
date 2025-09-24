import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'

import env, { isDevEnv } from '@/lib/env'

import * as schema from './schema'

const client = neon(env.DB_URL)

const db = drizzle(client, {
  schema, // enables type safety and autocompletion
  logger: isDevEnv(), // enable SQL query logging during development only
})

export default db
