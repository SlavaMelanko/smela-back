import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import { config } from 'dotenv'

config({ path: '.env' })

const sql = neon(process.env.DB_URL!)

const db = drizzle({ client: sql })

export default db
