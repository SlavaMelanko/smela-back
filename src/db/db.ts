import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'

import env from '@/lib/env'

import * as schema from './schema'

const client = neon(env.DB_URL)

const db = drizzle(client, {
  schema, // enables type safety and autocompletion
  logger: true, // logs SQL queries to the console
})

export default db
